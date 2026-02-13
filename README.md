# ADO Health Reporter

This project provides a comprehensive project health report for Azure Repos by analyzing Pull Request (PR) data. It generates a CSV report containing key engagement and performance metrics and includes a modern, lightweight dashboard to visualize the data.

## Features

### Core Analysis
*   **Engagement Filtering**: Extracts human-only comments (excluding system updates) to gauge genuine team interaction.
*   **Reviewer Performance**: Calculates "Response Time" (time from PR creation to first non-author comment/vote) to identify bottlenecks.
*   **Merge Velocity**: Tracks "Hours to Merge" for completed PRs to help with sprint planning.
*   **Data Mapping**: Links PR authors to engagement levels, merge speeds, and status.

### Utilities & Tools
*   **Automated Data Extraction**: Fetches PR data directly from Azure DevOps using the API.
*   **Date Range Filtering**: Analyze PRs within a specific timeframe using command-line arguments or environment variables.
*   **CSV Export**: Generates `ado_detailed_health.csv` containing raw data for further analysis.
*   **Repository Discovery**: Includes a utility script (`list-repos.ts`) to list all available repositories within your ADO organization and project.
*   **Mock Data Generator**: Capability to generate realistic mock data (`generate-mock-data.ts`) for testing and demonstrating the dashboard without an active ADO connection.
*   **Visual Dashboard**: A standalone HTML dashboard (`dashboard/index.html`) to visualize KPIs, charts (Author distribution, Response Time, Status), and detailed data.

## Future Roadmap (Planned Extensions)

1.  **Team-Based Analysis**: Group authors and reviewers by teams defined in a config file.
3.  **PR Size Metrics**: Include lines of code added/deleted in the CSV report.
4.  **Review Depth Metric**: Calculate average length of comments or number of iterations (threads requiring re-work).
5.  **Weekend/Off-Hours Activity**: Flag PRs created or reviewed during weekends or outside standard hours.
6.  **Stale PR Detection**: Identify PRs that have been open and inactive for X days.
7.  **Self-Review Detection**: Flag PRs where the author approved their own PR (if policy allows) or where there are zero comments/reviews before merge.
8.  **Automated Email Reports**: Send the summary report via email after generation.
9.  **Integration with Slack/Teams**: Post a summary of the health report to a chat channel.
10. **Multi-Repo Aggregation**: Allow configuring multiple repo IDs to generate a combined report.
11. **Exclude/Include Patterns**: Filter PRs based on branch names (e.g., exclude `release/*` or include only `main`).
12. **Reviewer Load Balancing**: Analyze how many active PRs each reviewer has assigned simultaneously.
13. **Comment Sentiment Analysis**: (Advanced) Use a simple sentiment score for comments to gauge tone.
14. **Time to First Approval**: Metric for how long it takes to get the first approval vote.
15. **Cross-Team Collaboration**: If teams are defined, measure how often one team reviews another's code.
16. **Hotspot Analysis**: Identify files or folders that appear most frequently in PRs (requires file-level data).
17. **Bug Linkage Rate**: Percentage of PRs linked to a work item (bug/user story).
18. **Revert Rate Detection**: Identify PRs that revert previous commits or are themselves reverted.
19. **CLI Interactive Mode**: A wizard-style CLI to set up the `.env` file.
20. **Export to JSON/HTML**: Option to export the data directly to JSON or a static HTML file (pre-filled) instead of just CSV.

## Metrics Explained

| Metric | The Question it Answers | Project Health Indicator |
|---|---|---|
| **Reviewer Response Hours** | How long does code sit idle before someone looks at it? | **Low Hours**: High team agility. <br> **High Hours (>24h)**: Context switching is killing productivity. |
| **Comment-to-Vote Ratio** | Are reviewers providing feedback or just voting? | **High Comments/No Vote**: Indicates "Nitpicking" or lack of clear standards. |
| **The 'Solo' Reviewer** | Is one person reviewing 80% of the PRs? | **High Concentration**: A single point of failure (SPOF) for the entire repo. |
| **Hours to Merge** | How long does it take for a "done" feature to get merged? | Helps in setting realistic expectations for Sprint Planning. |

## Prerequisites

*   Node.js (v14 or later)
*   Azure DevOps Personal Access Token (PAT) with **Code (Read)** permissions.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd ado-health-reporter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    ADO_ORG_URL=https://dev.azure.com/your-org
    ADO_PAT=your_personal_access_token
    ADO_REPO_ID=your_repository_id_or_guid
    ADO_PROJECT=your_project_name
    ```

## Usage

### Listing Repositories

To find the Repository ID for your project:

```bash
npx ts-node src/list-repos.ts
```

### Generating the Report

To connect to Azure DevOps and generate the real report:

```bash
npx ts-node src/generate-report.ts
```

This will create `ado_detailed_health.csv` in the root directory.

### Date Range Filtering

You can filter PRs by creation date using command-line arguments:

```bash
# Filter by start date
npx ts-node src/generate-report.ts --start 2023-01-01

# Filter by end date
npx ts-node src/generate-report.ts --end 2023-01-31

# Filter by range
npx ts-node src/generate-report.ts --start 2023-01-01 --end 2023-01-31
```

Alternatively, you can set `START_DATE` and `END_DATE` in your `.env` file or environment variables.

### Generating Mock Data (For Testing)

If you don't have an ADO connection yet, you can generate realistic mock data:

```bash
npx ts-node src/generate-mock-data.ts
```

### Viewing the Dashboard

1.  Ensure `ado_detailed_health.csv` is present in the root directory.
2.  Open `dashboard/index.html`.
    *   **Note**: Due to browser security restrictions (CORS), you cannot open the HTML file directly from the file system if it tries to load the CSV. You must serve it via a local server.
    *   **Quick Start**:
        ```bash
        # From the project root
        npx http-server .
        ```
    *   Navigate to `http://localhost:8080/dashboard/index.html`.

## Dashboard Preview

![Dashboard Screenshot](docs/dashboard.png)

## How to Use the Output

*   **Spot Burnout**: Look for high `Reviewer_Response_Hours` + high volume of PRs for specific reviewers.
*   **Identify Silent Merges**: Filter for `Human_Comment_Count = 0`. These are high-risk merges.
*   **Optimize Planning**: Use the average `Hours_to_Merge` to better estimate feature delivery times.
