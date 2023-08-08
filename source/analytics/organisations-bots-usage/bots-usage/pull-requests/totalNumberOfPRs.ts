import { PullRequest } from "../../organisation-info";

export function totalNumberOfPRs(pullRequests: PullRequest[]): number {
    return pullRequests.length;
  }