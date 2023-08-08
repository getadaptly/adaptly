import { PullRequest } from "../../organisation-info";

export function averageMergedPRsPerMonthLastYear(pullRequests: PullRequest[]): number {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const mergedPRs = pullRequests.filter(pr => pr.merged && new Date(pr.createdAt) > oneYearAgo);
    
    if (mergedPRs.length === 0) return 0;
  
    const monthsSpanned = 12;

    const average = mergedPRs.length / monthsSpanned;
    const roundedAverage = average.toFixed(2);

    return parseFloat(roundedAverage);
  }