import { PullRequest } from "../../organisation-info";

export function averageDaysToMerge(pullRequests: PullRequest[]): number {
    if (pullRequests.length === 0) return 0; // Return 0 if no pull requests
    
    const timeDifferences = pullRequests
    .filter(pr => pr.merged || pr.closedAt) // Only consider PRs that are merged or closed
    .map(pr => {
      const endTime = pr.mergedAt ? new Date(pr.mergedAt) : new Date(pr.closedAt as string);
      return endTime.getTime() - new Date(pr.createdAt).getTime();
    });
  
  return timeDifferences.length > 0 
    ? timeDifferences.reduce((acc, val) => acc + val, 0) / timeDifferences.length / (1000 * 60 * 60 * 24)
    : 0;
  }