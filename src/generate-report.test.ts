import { GitPullRequest, GitPullRequestCommentThread, PullRequestStatus, CommentType } from "azure-devops-node-api/interfaces/GitInterfaces";
import { countHumanComments, calculateHoursToMerge, calculateReviewerResponse } from "./generate-report";

describe('Utility Functions in generate-report.ts', () => {

  describe('countHumanComments', () => {
    it('should correctly count human comments, ignoring system and deleted comments', () => {
      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            { commentType: CommentType.Text, isDeleted: false }, // Count: 1
            { commentType: CommentType.System, isDeleted: false }, // System - ignore
            { commentType: CommentType.Text, isDeleted: true }, // Deleted - ignore
          ]
        },
        {
          comments: [
            { commentType: CommentType.Text, isDeleted: false }, // Count: 2
            { commentType: CommentType.CodeChange, isDeleted: false } // Count: 3
          ]
        },
        {} // Empty thread - ignore
      ];

      const count = countHumanComments(threads);
      expect(count).toBe(3);
    });

    it('should return 0 when there are no comments', () => {
      const threads: GitPullRequestCommentThread[] = [];
      const count = countHumanComments(threads);
      expect(count).toBe(0);
    });
  });

  describe('calculateHoursToMerge', () => {
    it('should correctly calculate the hours difference between creation and closed date for completed PRs', () => {
      const pr: GitPullRequest = {
        status: PullRequestStatus.Completed,
        creationDate: new Date('2023-01-01T10:00:00Z'),
        closedDate: new Date('2023-01-01T12:30:00Z') // 2.5 hours later
      };

      const result = calculateHoursToMerge(pr);
      expect(result).toBe("2.50");
    });

    it('should return "N/A" if PR is not completed', () => {
      const pr: GitPullRequest = {
        status: PullRequestStatus.Active,
        creationDate: new Date('2023-01-01T10:00:00Z'),
      };

      const result = calculateHoursToMerge(pr);
      expect(result).toBe("N/A");
    });

    it('should return "N/A" if closedDate is missing', () => {
      const pr: GitPullRequest = {
        status: PullRequestStatus.Completed,
        creationDate: new Date('2023-01-01T10:00:00Z'),
      };

      const result = calculateHoursToMerge(pr);
      expect(result).toBe("N/A");
    });

    it('should return "N/A" if creationDate is missing', () => {
      const pr: GitPullRequest = {
        status: PullRequestStatus.Completed,
        closedDate: new Date('2023-01-01T10:00:00Z'),
      };

      const result = calculateHoursToMerge(pr);
      expect(result).toBe("N/A");
    });
  });

  describe('calculateReviewerResponse', () => {
    it('should identify lead reviewer and response hours accurately for a single valid response', () => {
      const pr: GitPullRequest = {
        creationDate: new Date('2023-01-01T10:00:00Z'),
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'reviewer@domain.com', displayName: 'Reviewer Name' },
              publishedDate: new Date('2023-01-01T11:00:00Z'), // 1 hour later
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: 'Reviewer Name', leadReviewerUniqueName: 'reviewer@domain.com', responseHours: "1.00" });
    });

    it('should ignore author\'s own comments', () => {
      const pr: GitPullRequest = {
        creationDate: new Date('2023-01-01T10:00:00Z'),
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'author@domain.com', displayName: 'Author Name' },
              publishedDate: new Date('2023-01-01T10:30:00Z'),
              commentType: CommentType.Text
            },
            {
              author: { uniqueName: 'reviewer@domain.com', displayName: 'Reviewer Name' },
              publishedDate: new Date('2023-01-01T12:00:00Z'), // 2 hours later
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: 'Reviewer Name', leadReviewerUniqueName: 'reviewer@domain.com', responseHours: "2.00" });
    });

    it('should ignore system comments', () => {
      const pr: GitPullRequest = {
        creationDate: new Date('2023-01-01T10:00:00Z'),
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'system@domain.com', displayName: 'System' },
              publishedDate: new Date('2023-01-01T10:30:00Z'),
              commentType: CommentType.System
            },
            {
              author: { uniqueName: 'reviewer@domain.com', displayName: 'Reviewer Name' },
              publishedDate: new Date('2023-01-01T11:30:00Z'), // 1.5 hours later
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: 'Reviewer Name', leadReviewerUniqueName: 'reviewer@domain.com', responseHours: "1.50" });
    });

    it('should handle the case where multiple reviewers comment, picking the first one', () => {
      const pr: GitPullRequest = {
        creationDate: new Date('2023-01-01T10:00:00Z'),
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'reviewer2@domain.com', displayName: 'Reviewer Two' },
              publishedDate: new Date('2023-01-01T12:00:00Z'), // 2 hours later
              commentType: CommentType.Text
            }
          ]
        },
        {
          comments: [
            {
              author: { uniqueName: 'reviewer1@domain.com', displayName: 'Reviewer One' },
              publishedDate: new Date('2023-01-01T11:00:00Z'), // 1 hour later
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: 'Reviewer One', leadReviewerUniqueName: 'reviewer1@domain.com', responseHours: "1.00" });
    });

    it('should return "N/A" if there are no valid reviewer comments', () => {
      const pr: GitPullRequest = {
        creationDate: new Date('2023-01-01T10:00:00Z'),
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'author@domain.com', displayName: 'Author' },
              publishedDate: new Date('2023-01-01T10:30:00Z'),
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: "N/A", leadReviewerUniqueName: "N/A", responseHours: "N/A" });
    });

    it('should return "N/A" if PR has no creation date', () => {
      const pr: GitPullRequest = {
        createdBy: { uniqueName: 'author@domain.com' }
      };

      const threads: GitPullRequestCommentThread[] = [
        {
          comments: [
            {
              author: { uniqueName: 'reviewer@domain.com', displayName: 'Reviewer Name' },
              publishedDate: new Date('2023-01-01T11:00:00Z'),
              commentType: CommentType.Text
            }
          ]
        }
      ];

      const result = calculateReviewerResponse(pr, threads);
      expect(result).toEqual({ leadReviewer: "N/A", leadReviewerUniqueName: "N/A", responseHours: "N/A" });
    });
  });
});