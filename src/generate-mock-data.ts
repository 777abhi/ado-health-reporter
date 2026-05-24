import { createObjectCsvWriter } from "csv-writer";
import { HealthReportRow } from "./generate-report";

const authors = ["Alice", "Bob", "Charlie", "David", "Eve"];
const reviewers = ["Frank", "Grace", "Heidi", "Ivan", "Judy"];
const statuses = ["Completed", "Active", "Abandoned"];
const mockRepos = ["web-frontend", "core-api", "infra-pipeline"];

const mockTeamsMap: Record<string, string[]> = {
    "Team Alpha": ["Alice", "Bob", "Frank", "Grace"],
    "Team Beta": ["Charlie", "David", "Heidi", "Ivan"],
    "Team Gamma": ["Eve", "Judy"]
};

function getTeamForMockUser(name: string): string {
    for (const [teamName, members] of Object.entries(mockTeamsMap)) {
        if (members.includes(name)) {
            return teamName;
        }
    }
    return "Unknown";
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr: string[]) {
    return arr[getRandomInt(0, arr.length - 1)];
}

async function generateMockData() {
    const records: HealthReportRow[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60);

    for (let i = 1; i <= 80; i++) { // Increased to 80 for better comparative views
        const createdDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const month = createdDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const status = getRandomItem(statuses);
        const repository = getRandomItem(mockRepos);

        let hoursToMerge = "N/A";
        if (status === "Completed") {
            hoursToMerge = (Math.random() * 100).toFixed(2);
        }

        let reviewerResponseHours = "N/A";
        let leadReviewer = "N/A";
        if (Math.random() > 0.1) { // 90% chance of having a reviewer
            reviewerResponseHours = (Math.random() * 48).toFixed(2);
            leadReviewer = getRandomItem(reviewers);
        }

        const author = getRandomItem(authors);

        records.push({
            PR_ID: 1000 + i,
            Repository: repository,
            Author: author,
            Author_Team: getTeamForMockUser(author),
            Created_Date: createdDate.toISOString().split('T')[0],
            Month: month,
            Status: status,
            Human_Comment_Count: getRandomInt(0, 15),
            Hours_to_Merge: hoursToMerge,
            Lead_Reviewer: leadReviewer,
            Reviewer_Team: leadReviewer !== "N/A" ? getTeamForMockUser(leadReviewer) : "N/A",
            Reviewer_Response_Hours: reviewerResponseHours
        });
    }

    const csvWriter = createObjectCsvWriter({
        path: 'ado_detailed_health.csv',
        header: [
            {id: 'PR_ID', title: 'PR_ID'},
            {id: 'Repository', title: 'Repository'},
            {id: 'Author', title: 'Author'},
            {id: 'Author_Team', title: 'Author_Team'},
            {id: 'Created_Date', title: 'Created_Date'},
            {id: 'Month', title: 'Month'},
            {id: 'Status', title: 'Status'},
            {id: 'Human_Comment_Count', title: 'Human_Comment_Count'},
            {id: 'Hours_to_Merge', title: 'Hours_to_Merge'},
            {id: 'Lead_Reviewer', title: 'Lead_Reviewer'},
            {id: 'Reviewer_Team', title: 'Reviewer_Team'},
            {id: 'Reviewer_Response_Hours', title: 'Reviewer_Response_Hours'}
        ]
    });

    await csvWriter.writeRecords(records);
    console.log("Mock data generated: ado_detailed_health.csv");
}

generateMockData();
