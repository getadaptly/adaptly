import { PullRequest } from "../../organisation-info";

export function distributionOfPRs(pullRequests: PullRequest[]): { OPEN: number, CLOSED: number, MERGED: number } {
    return pullRequests.reduce((acc, pr) => {
      acc[pr.state] = (acc[pr.state] || 0) + 1;
      return acc;
    }, { OPEN: 0, CLOSED: 0, MERGED: 0 });
  }