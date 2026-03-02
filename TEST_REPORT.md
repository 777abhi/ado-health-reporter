# ADO Health Reporter Utility - Test Report

## Overview
This document explains the test suite created to verify the utility functions inside the `src/generate-report.ts` file. The utility functions are crucial for generating the ADO Health Report as they perform core data extraction and analysis metrics. We use `jest` as the testing framework to ensure correctness and maintainability of these functions.

## Execution Details
- **Date Executed:** 2026-03-02 06:07:36
- **Test Framework:** Jest
- **Target File:** `src/generate-report.ts`
- **Covered Functions:** `countHumanComments`, `calculateHoursToMerge`, `calculateReviewerResponse`

## Features Tested

### 1. `countHumanComments`
Calculates the total number of human comments made in the PR. It excludes any system-generated or deleted comments.

**Test Cases:**
- Correctly counts human comments, ignoring system and deleted comments.
- Returns 0 when there are no comments.

### 2. `calculateHoursToMerge`
Calculates the hours passed from PR creation to the completion (closing) of the PR.

**Test Cases:**
- Correctly calculates the hours difference between creation and closed date for completed PRs.
- Returns "N/A" if the PR is not completed.
- Returns "N/A" if the `closedDate` is missing.
- Returns "N/A" if the `creationDate` is missing.

### 3. `calculateReviewerResponse`
Calculates the response time in hours from PR creation to the first response by a reviewer (non-author). Identifies the lead reviewer based on the first comment.

**Test Cases:**
- Identifies lead reviewer and response hours accurately for a single valid response.
- Ignores author's own comments.
- Ignores system comments.
- Handles the case where multiple reviewers comment, picking the first one.
- Returns "N/A" if there are no valid reviewer comments.
- Returns "N/A" if PR has no `creationDate`.

## Coverage Summary
The table below represents the coverage stats of the utility functions executed during the most recent test run:

| File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s             |
|---------------------|---------|----------|---------|---------|-------------------------------|
| **All files**       |   43.26 |    37.68 |   42.85 |   45.91 |                               |
| `generate-report.ts`|   43.26 |    37.68 |   42.85 |   45.91 | 22-24,28-33,37,75,138-237,243 |

*Note: The remaining uncovered lines belong to API wrapper functions (`getAdoConnection`, `fetchPullRequests`, `fetchPrThreads`) and the main execution block (`run`), which require live interactions or mocks not currently implemented as pure utility test cases.*
