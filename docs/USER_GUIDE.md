# ADO Health Reporter: Exploratory Testing Guide

Welcome to the Exploratory Testing Guide for the **ADO Health Reporter**. This guide will help you manually test the core features of the application, from generating data to visualizing it on the dashboard.

## Prerequisites
Before you begin testing, ensure you have the following setup:
*   **Node.js**: Version 14 or later installed on your machine.
*   **Git**: To clone the repository.
*   *(Optional)* **Azure DevOps Personal Access Token (PAT)**: Required only if you are testing real data extraction. The PAT must have **Code (Read)** permissions.
*   *(Optional)* **Azure DevOps Organization URL & Project Name**: Required for real data extraction.

---

## Testing Core Features

### Feature 1: Setup and Initialization
Verify that the project can be cloned and dependencies installed successfully.

1.  **Open** your terminal or command prompt.
2.  **Run** the following command to clone the repository: `git clone <repo-url>`
3.  **Navigate** into the project directory: `cd ado-health-reporter`
4.  **Run** the installation command: `npm install`
5.  **Create** a new file named `.env` in the root directory.
6.  **Add** the following variables to the `.env` file (you can leave values empty if you only plan to test with Mock Data):
    ```env
    ADO_ORG_URL=https://dev.azure.com/your-org
    ADO_PAT=your_personal_access_token
    ADO_REPO_ID=your_repository_id_or_guid
    ADO_PROJECT=your_project_name
    ```
7.  **Save** the `.env` file.

> **Pro-Tip:** If you only want to test the dashboard visualization, you can skip configuring the `.env` file and jump straight to **Feature 2: Mock Data Generation**.

---

### Feature 2: Mock Data Generation
Verify that the tool can generate synthetic data for testing the dashboard without an active ADO connection.

1.  **Open** your terminal in the project root directory.
2.  **Run** the mock data generator script: `npx ts-node src/generate-mock-data.ts`
3.  **Verify** that a file named `ado_detailed_health.csv` has been created in the root directory.

*[Screenshot Placeholder: Terminal window showing successful execution of the mock data script and the newly created `ado_detailed_health.csv` file in the directory]*

> **Pro-Tip:** Generating mock data is the fastest way to verify the dashboard's rendering logic without worrying about ADO API rate limits or connectivity issues.

---

### Feature 3: Dashboard Visualization
Verify that the HTML dashboard correctly parses the generated CSV and displays the metrics.

1.  **Ensure** the `ado_detailed_health.csv` file exists in the root directory.
2.  **Run** the local HTTP server to serve the dashboard: `npx http-server .`
3.  **Open** your web browser.
4.  **Navigate** to the URL provided by the server (usually `http://localhost:8080/dashboard/index.html` or `http://127.0.0.1:8080/dashboard/index.html`).
5.  **Verify** that the dashboard loads.
6.  **Check** that the "Reviewer Response Hours", "Comment-to-Vote Ratio", and "Hours to Merge" charts are populated with data.

*[Screenshot Placeholder: The main dashboard in the browser, highlighting the top KPI cards and the 'Author distribution' chart]*

> **Pro-Tip:** If the dashboard doesn't update after you generate new data, try doing a "hard refresh" in your browser (Ctrl+F5 or Cmd+Shift+R) to clear the cache.

---

### Feature 4: Repository Discovery (Requires ADO Setup)
Verify that the tool can successfully list repositories from the configured ADO project.

1.  **Ensure** your `.env` file is fully populated with `ADO_ORG_URL`, `ADO_PAT`, and `ADO_PROJECT`.
2.  **Open** your terminal.
3.  **Run** the repository discovery script: `npx ts-node src/list-repos.ts`
4.  **Verify** that a list of repositories and their corresponding IDs is printed to the console.

*[Screenshot Placeholder: Terminal window showing the output of `list-repos.ts` with repository names and IDs]*

> **Pro-Tip:** Copy the ID of the repository you want to analyze and paste it into your `.env` file as the `ADO_REPO_ID` for the next test.

---

### Feature 5: Real Report Generation (Requires ADO Setup)
Verify that the tool can extract real PR data from ADO and filter it by date.

1.  **Ensure** your `.env` file has a valid `ADO_REPO_ID` set.
2.  **Run** the main report generation script: `npx ts-node src/generate-report.ts`
3.  **Verify** that the `ado_detailed_health.csv` file is updated with real data.
4.  **Run** the script again with date filters to test the filtering logic: `npx ts-node src/generate-report.ts --start 2023-01-01 --end 2023-01-31`
5.  **Check** the generated CSV file to ensure all records fall within the specified date range.

*[Screenshot Placeholder: Terminal window showing the execution of `generate-report.ts` with date arguments, and a snippet of the resulting CSV data]*

> **Pro-Tip:** Date filtering is crucial for large repositories. Always use `--start` and `--end` to limit the data extraction to a specific sprint or month to avoid long execution times.

---

## Troubleshooting

Here are some common issues you might encounter during your first try:

*   **Error: `Cannot find module 'ts-node'` or `npm ERR!` during scripts**
    *   *Cause*: Dependencies were not installed correctly.
    *   *Solution*: Run `npm install` again in the project root directory.

*   **Dashboard shows no data or is blank**
    *   *Cause*: The browser is blocking the CSV file due to CORS policy, or the CSV file does not exist.
    *   *Solution*: Ensure you are running the dashboard through a local server (`npx http-server .`) and accessing it via `http://localhost:8080/dashboard/index.html`. Do not open the HTML file directly from your file explorer. Make sure you generated the CSV file first.

*   **Error: `Failed to authenticate` or `401 Unauthorized`**
    *   *Cause*: Invalid or expired Azure DevOps PAT.
    *   *Solution*: Check your `.env` file. Generate a new PAT with **Code (Read)** permissions in Azure DevOps and update the `ADO_PAT` value.

*   **Error: `Project not found` or `Repository not found`**
    *   *Cause*: Incorrect URL, Project Name, or Repository ID in the `.env` file.
    *   *Solution*: Double-check the values in your `.env` file against your Azure DevOps organization. Use the `src/list-repos.ts` script to verify repository IDs.
