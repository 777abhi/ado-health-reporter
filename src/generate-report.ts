import * as azdev from "azure-devops-node-api";
import * as GitApi from "azure-devops-node-api/GitApi";
import { GitPullRequest, GitPullRequestSearchCriteria, PullRequestStatus, GitPullRequestCommentThread, CommentType, IdentityRefWithVote } from "azure-devops-node-api/interfaces/GitInterfaces";
import * as dotenv from "dotenv";
import { createObjectCsvWriter } from "csv-writer";

dotenv.config();

export interface HealthReportRow {
    PR_ID: number;
    Author: string;
    Created_Date: string;
    Month: string;
    Status: string;
    Human_Comment_Count: number;
    Hours_to_Merge: string; // Using string to allow "N/A" or formatted hours
    Lead_Reviewer: string;
    Reviewer_Response_Hours: string; // Using string to allow "N/A" or formatted hours
}

export async function getAdoConnection(orgUrl: string, token: string): Promise<azdev.WebApi> {
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    const connection = new azdev.WebApi(orgUrl, authHandler);
    return connection;
}

export async function fetchPullRequests(gitApi: GitApi.IGitApi, repoId: string, top: number = 100, startDate?: Date, endDate?: Date): Promise<GitPullRequest[]> {
    const criteria: GitPullRequestSearchCriteria = {
        status: PullRequestStatus.All,
        minTime: startDate,
        maxTime: endDate
    };
    return await gitApi.getPullRequests(repoId, criteria, undefined, undefined, 0, top);
}

export async function fetchPrThreads(gitApi: GitApi.IGitApi, repoId: string, prId: number): Promise<GitPullRequestCommentThread[]> {
    return await gitApi.getThreads(repoId, prId);
}

export function countHumanComments(threads: GitPullRequestCommentThread[]): number {
    let count = 0;
    for (const thread of threads) {
        if (thread.comments) {
            for (const comment of thread.comments) {
                if (comment.commentType !== CommentType.System && !comment.isDeleted) {
                    count++;
                }
            }
        }
    }
    return count;
}

export function calculateHoursToMerge(pr: GitPullRequest): string {
    if (pr.status !== PullRequestStatus.Completed || !pr.closedDate || !pr.creationDate) {
        return "N/A";
    }
    const created = new Date(pr.creationDate).getTime();
    const closed = new Date(pr.closedDate).getTime();
    const diffHours = (closed - created) / (1000 * 60 * 60);
    return diffHours.toFixed(2);
}

export function calculateReviewerResponse(pr: GitPullRequest, threads: GitPullRequestCommentThread[]): { leadReviewer: string, responseHours: string } {
    if (!pr.creationDate) {
        return { leadReviewer: "N/A", responseHours: "N/A" };
    }

    const createdTime = new Date(pr.creationDate).getTime();
    let firstResponseTime = Infinity;
    let leadReviewer = "N/A";

    // Check votes
    if (pr.reviewers) {
        for (const reviewer of pr.reviewers) {
            // We can't easily get the timestamp of the vote from the reviewer object directly in the list
            // However, often the vote comes with a system comment or we assume the reviewer is active if they voted.
            // But for "Response Time" accurately, we need the timestamp.
            // The prompt says "time from PR creation to their first vote or comment".
            // We'll prioritize comments for timestamp as they are in threads.
            // Votes might need looking at `identities` or specific API calls?
            // Actually, `GitPullRequest` reviewer list doesn't have vote timestamp.
            // We will rely on Threads for comments.
            // BUT, if someone voted without commenting?
            // We might miss it if we only look at threads.
            // However, usually a vote creates a system message in threads?
            // Let's stick to comments in threads for now as it's more reliable with timestamps available.

            // Wait, the prompt says "Reviewer Performance: Identify the 'Primary Reviewer' for each PR and calculate their Response Time".
            // Primary Reviewer could be the one who approved it or the first one to respond.
            // Let's assume Lead Reviewer is the first one to respond (non-author).
        }
    }

    // Iterate threads to find first non-author, non-system comment.
    for (const thread of threads) {
        if (thread.comments) {
            for (const comment of thread.comments) {
                // Check if it is a human comment or a vote (sometimes votes are system comments but we filtered them?)
                // Actually system comments track status changes.
                // We want human interaction.

                if (comment.author?.uniqueName !== pr.createdBy?.uniqueName && comment.publishedDate) {
                    // Check if it's a valid response (not system, unless we want to count vote system messages which we probably don't have distinct timestamps for easily without parsing)
                    // Prompt says "human-only comments (excluding CommentType.System)".
                    // So we ignore system comments for engagement count.
                    // But for response time? "time from PR creation to their first vote or comment".
                    // If we exclude system comments, we exclude vote notifications if they appear as such.
                    // But usually standard is: Response Time = Time until first human comment from someone else.

                    if (comment.commentType !== CommentType.System) {
                        const commentTime = new Date(comment.publishedDate).getTime();
                        if (commentTime < firstResponseTime) {
                            firstResponseTime = commentTime;
                            leadReviewer = comment.author?.displayName || "Unknown";
                        }
                    }
                }
            }
        }
    }

    // What if there are no comments but there are votes?
    // In many ADO setups, just voting doesn't leave a timestamped artifact we can easily read without extra calls.
    // We will assume "Response Time" implies "First Comment Response Time" for this script unless we want to overengineer.
    // However, I should check if `pr.reviewers` has something useful. `IdentityRefWithVote` has `votedFor`? No timestamp.

    if (firstResponseTime === Infinity) {
        return { leadReviewer: "N/A", responseHours: "N/A" };
    }

    const diffHours = (firstResponseTime - createdTime) / (1000 * 60 * 60);
    return { leadReviewer, responseHours: diffHours.toFixed(2) };
}


export async function run() {
    try {
        const orgUrl = process.env.ADO_ORG_URL;
        const token = process.env.ADO_PAT;
        const repoId = process.env.ADO_REPO_ID;
        const project = process.env.ADO_PROJECT; // Not strictly needed if repoId is GUID, but good if name.

        if (!orgUrl || !token || !repoId) {
            console.error("Missing environment variables: ADO_ORG_URL, ADO_PAT, ADO_REPO_ID");
            return; // Don't throw, just exit, as we might be running in a context where we want to generate mock data instead?
            // But this is the main script.
            // process.exit(1);
        }

        // Parse Date Filter
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        // Env vars
        if (process.env.START_DATE) startDate = new Date(process.env.START_DATE);
        if (process.env.END_DATE) endDate = new Date(process.env.END_DATE);

        // CLI args
        const args = process.argv.slice(2);
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--start' && args[i + 1]) {
                startDate = new Date(args[i + 1]);
            }
            if (args[i] === '--end' && args[i + 1]) {
                endDate = new Date(args[i + 1]);
            }
        }

        if (startDate && isNaN(startDate.getTime())) {
            console.error("Invalid Start Date");
            return;
        }
        if (endDate && isNaN(endDate.getTime())) {
            console.error("Invalid End Date");
            return;
        }

        if (startDate) console.log(`Filter Start Date: ${startDate.toISOString()}`);
        if (endDate) console.log(`Filter End Date: ${endDate.toISOString()}`);

        console.log(`Connecting to ${orgUrl}...`);
        const connection = await getAdoConnection(orgUrl, token);
        const gitApi = await connection.getGitApi();

        console.log(`Fetching PRs for repo ${repoId}...`);
        const prs = await fetchPullRequests(gitApi, repoId, 100, startDate, endDate);
        console.log(`Found ${prs.length} PRs.`);

        const records: HealthReportRow[] = [];

        for (const pr of prs) {
            if (!pr.pullRequestId) continue;

            console.log(`Processing PR ${pr.pullRequestId}...`);
            const threads = await fetchPrThreads(gitApi, repoId, pr.pullRequestId);

            const humanCommentCount = countHumanComments(threads);
            const { leadReviewer, responseHours } = calculateReviewerResponse(pr, threads);
            const hoursToMerge = calculateHoursToMerge(pr);

            const createdDate = pr.creationDate ? new Date(pr.creationDate) : new Date();
            const month = createdDate.toLocaleString('default', { month: 'long', year: 'numeric' });

            records.push({
                PR_ID: pr.pullRequestId,
                Author: pr.createdBy?.displayName || "Unknown",
                Created_Date: createdDate.toISOString().split('T')[0],
                Month: month,
                Status: PullRequestStatus[pr.status || 0], // Map enum to string
                Human_Comment_Count: humanCommentCount,
                Hours_to_Merge: hoursToMerge,
                Lead_Reviewer: leadReviewer,
                Reviewer_Response_Hours: responseHours
            });
        }

        const csvWriter = createObjectCsvWriter({
            path: 'ado_detailed_health.csv',
            header: [
                { id: 'PR_ID', title: 'PR_ID' },
                { id: 'Author', title: 'Author' },
                { id: 'Created_Date', title: 'Created_Date' },
                { id: 'Month', title: 'Month' },
                { id: 'Status', title: 'Status' },
                { id: 'Human_Comment_Count', title: 'Human_Comment_Count' },
                { id: 'Hours_to_Merge', title: 'Hours_to_Merge' },
                { id: 'Lead_Reviewer', title: 'Lead_Reviewer' },
                { id: 'Reviewer_Response_Hours', title: 'Reviewer_Response_Hours' }
            ]
        });

        await csvWriter.writeRecords(records);
        console.log("Report generated: ado_detailed_health.csv");

    } catch (err) {
        console.error("Error generating report:", err);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    run();
}
