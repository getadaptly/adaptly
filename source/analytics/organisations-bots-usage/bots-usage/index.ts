import { Organization, PullRequest, Repository } from "../organisation-info";
import { averageDaysToMerge } from "./pull-requests/averageDaysToMerge";
import { averageMergedPRsPerMonthLastYear } from "./pull-requests/averageMergedPRsPerMonthLastYear";
import { distributionOfPRs } from "./pull-requests/distributionOfPRs";
import { ratioOfMergedPRsToTotal } from "./pull-requests/ratioOfMergedPRsToTotal";
import { totalNumberOfPRs } from "./pull-requests/totalNumberOfPRs";

export type BotsUsageOrganisation = { organisationName: string; } & BotsUsage & {
    repositories: BotsUsageRepository[];
};
  
  
type BotsUsageRepository = {
    name: string;
    stars: number;
} & BotsUsage;

type BotsUsage = {
    renovate: BotUsage;
    dependabot: BotUsage;
};
    
type BotUsage = {
    prsCount: number;
    prsCountByState: { OPEN: number, MERGED: number, CLOSED: number };
    prsMergedPerMonthLastYear: number;
    prsMergedToTotalRatio: number;
    prsAverageDaysToMerge: number;
};

export function getBotsUsage(organisation: Organization): BotsUsageOrganisation {  
  const reposWithMetrics: BotsUsageRepository[] = [];

  organisation.repositories.forEach(repo => {
      const renovateUsage = getBotUsage(repo.pullRequestsRenovate);
      const dependabotUsage = getBotUsage(repo.pullRequestsDependabot);
      
      const hasBotPr = renovateUsage.prsCount > 0 || dependabotUsage.prsCount > 0;
      if (!hasBotPr) {
          return;
      }

      reposWithMetrics.push({
          name: repo.name,
          stars: repo.stars,
          renovate: renovateUsage,
          dependabot: dependabotUsage
      })
  });

  const orgMetrics = getOrganisationBotsUsage(reposWithMetrics);

  return {
      organisationName: organisation.name,
      renovate: orgMetrics.renovate,
      dependabot: orgMetrics.dependabot,
      repositories: reposWithMetrics
  }
}

function getBotUsage(pullRequests: PullRequest[]): BotUsage {
  return {
    prsCount: totalNumberOfPRs(pullRequests),
    prsMergedPerMonthLastYear: averageMergedPRsPerMonthLastYear(pullRequests),
    prsMergedToTotalRatio: ratioOfMergedPRsToTotal(pullRequests),
    prsAverageDaysToMerge: averageDaysToMerge(pullRequests),
    prsCountByState: distributionOfPRs(pullRequests)
  };
}

function getOrganisationBotsUsage(reposWithMetrics: BotsUsageRepository[]): BotsUsage {
  const repoRenovateMetrics: BotUsage[] = [];
  const repoDependabotMetrics: BotUsage[] = [];

  reposWithMetrics.forEach(repo => {
      repoRenovateMetrics.push(repo.renovate);
      repoDependabotMetrics.push(repo.dependabot);
  });

  const combinedRenovateMetrics = combineRepositoriesMetrics(repoRenovateMetrics, reposWithMetrics.length);
  const combinedDependabotMetrics = combineRepositoriesMetrics(repoDependabotMetrics, reposWithMetrics.length);
  
  return {
      renovate: combinedRenovateMetrics,
      dependabot: combinedDependabotMetrics
  }
};

function combineRepositoriesMetrics(repositoriesMetrics: BotUsage[], numberOfRepos: number): BotUsage {
  const combinedMetrics: BotUsage = {
    prsCount: 0,
    prsMergedPerMonthLastYear: 0,
    prsMergedToTotalRatio: 0,
    prsAverageDaysToMerge: 0,
    prsCountByState: { OPEN: 0, CLOSED: 0, MERGED: 0 }
  };
  
    if (!repositoriesMetrics.length) {
      return combinedMetrics;
  }

  repositoriesMetrics.forEach(metrics => {
      combinedMetrics.prsCount += metrics.prsCount;
      combinedMetrics.prsMergedPerMonthLastYear += metrics.prsMergedPerMonthLastYear;
      
      combinedMetrics.prsAverageDaysToMerge += metrics.prsAverageDaysToMerge;
      combinedMetrics.prsCountByState.OPEN += metrics.prsCountByState.OPEN;
      combinedMetrics.prsCountByState.CLOSED += metrics.prsCountByState.CLOSED;
      combinedMetrics.prsCountByState.MERGED += metrics.prsCountByState.MERGED;
  });

  combinedMetrics.prsMergedToTotalRatio = toFixed2(combinedMetrics.prsCountByState.MERGED / combinedMetrics.prsCount);
  combinedMetrics.prsAverageDaysToMerge = toFixed2(combinedMetrics.prsAverageDaysToMerge / numberOfRepos);
  combinedMetrics.prsMergedPerMonthLastYear = toFixed2(combinedMetrics.prsMergedPerMonthLastYear);
  
  return combinedMetrics;
}

  function toFixed2(number: number): number {
    return parseFloat(number.toFixed(2));
  }