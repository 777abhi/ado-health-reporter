import * as azdev from "azure-devops-node-api";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const orgUrl = process.env.ADO_ORG_URL;
    const token = process.env.ADO_PAT;

    if (!orgUrl || !token || orgUrl.includes("your-org") || token.includes("your_personal_access_token")) {
        console.error("Error: Please update ADO_ORG_URL and ADO_PAT in your .env file first.");
        console.log("Edit .env and replace the placeholder values with your actual Azure DevOps URL and PAT.");
        return;
    }

    try {
        const authHandler = azdev.getPersonalAccessTokenHandler(token);
        const connection = new azdev.WebApi(orgUrl, authHandler);
        const gitApi = await connection.getGitApi();

        console.log(`Connecting to ${orgUrl}...`);
        const repos = await gitApi.getRepositories();

        if (!repos || repos.length === 0) {
            console.log("No repositories found or access denied. Check your PAT permissions (Code Read).");
            return;
        }

        console.log("\nAvailable Repositories:");
        console.log("--------------------------------------------------------------------------------");
        console.log(( "Name").padEnd(40) + "ID");
        console.log("--------------------------------------------------------------------------------");
        
        repos.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        const projectFilter = process.env.ADO_PROJECT;
        let count = 0;

        for (const repo of repos) {
            // Optional: Filter by project if set, otherwise show all
            if (projectFilter && repo.project?.name !== projectFilter && projectFilter !== "your_project_name") {
                continue;
            }
            console.log(String(repo.name).padEnd(40) + repo.id);
            count++;
        }
        console.log("--------------------------------------------------------------------------------");
        if (count === 0 && projectFilter) {
            console.log(`No repositories found for project '${projectFilter}'. Try removing ADO_PROJECT from .env to see all.`);
        }

    } catch (err: any) {
        console.error("Failed to list repositories:", err.message);
        if (err.statusCode === 401) {
            console.error("Tip: Verify your Personal Access Token (PAT) is correct and has 'Code (Read)' scope.");
        }
    }
}

run().catch(console.error);
