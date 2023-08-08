import { PullRequest } from "../../organisation-info";

export function ratioOfMergedPRsToTotal(pullRequests: PullRequest[]): number {
    if (pullRequests.length === 0) return 0; // Return 0 if no pull requests
    
    const mergedPRs = pullRequests.filter(pr => pr.merged).length;

    return parseFloat((mergedPRs / pullRequests.length).toFixed(2));
}