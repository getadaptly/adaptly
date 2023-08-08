import { GraphQLClient, gql } from 'graphql-request';
import { getBotsUsage } from '../bots-usage';
import Logger from '@adaptly/logging/logger';

export type Organization = {
  name: string;
  repositories: Repository[];
};


export type Repository = {
  name: string;
  stars: number;
  pullRequestsRenovate: PullRequest[];
  pullRequestsDependabot: PullRequest[];
};

export type PullRequest = {
  title: string;
  url: string;
  merged: boolean;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  createdAt: string;
  closedAt: string | null;
  mergedAt: string | null;
};


const mapPullRequestInfo = (pr: any): PullRequest => ({
  title: pr.title,
  url: pr.url,
  merged: pr.merged,
  state: pr.state,
  createdAt: pr.createdAt,
  closedAt: pr.closedAt,
  mergedAt: pr.mergedAt,
});

export async function getOrganizationInfo(organization: string): Promise<Organization> {
  const repositories: Repository[] = [];

  const endpoint = 'https://api.github.com/graphql';
  const client = new GraphQLClient(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer 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`,
    },
  });

  let hasNextPageRepo = true;
  let endCursorRepo: string | null = null;

  while (hasNextPageRepo) {
    const queryRepo = gql`
      query ($organization: String!, $after: String) {
        organization(login: $organization) {
          name
          repositories(first: 100, after: $after) {
            nodes {
              name
              stargazerCount
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

    const responseRepo: any = await client.request(queryRepo, { organization, after: endCursorRepo });
    const repositoriesData = responseRepo.organization.repositories.nodes;

    for (const repo of repositoriesData) {
      let hasNextPagePR = true;
      let endCursorPR: string | null = null;
      const pullRequestsRenovate: PullRequest[] = [];
      const pullRequestsDependabot: PullRequest[] = [];

      while (hasNextPagePR) {
        const queryPR = gql`
          query ($organization: String!, $repoName: String!, $after: String) {
            repository(owner: $organization, name: $repoName) {
              pullRequests(first: 100, after: $after) {
                nodes {
                  title
                  url
                  merged
                  state
                  createdAt
                  closedAt
                  mergedAt
                  author {
                    login
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        `;

        const responsePR: any = await client.request(queryPR, { organization, repoName: repo.name, after: endCursorPR });

        pullRequestsRenovate.push(
          ...responsePR.repository.pullRequests.nodes
            .filter((pr: any) => pr.author && pr.author.login === 'renovate')
            .map(mapPullRequestInfo)
        );
        pullRequestsDependabot.push(
          ...responsePR.repository.pullRequests.nodes
            .filter((pr: any) => pr.author && pr.author.login === 'dependabot')
            .map(mapPullRequestInfo)
        );

        hasNextPagePR = responsePR.repository.pullRequests.pageInfo.hasNextPage;
        endCursorPR = responsePR.repository.pullRequests.pageInfo.endCursor;
      }

      pullRequestsRenovate.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      pullRequestsDependabot.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      repositories.push({
        name: repo.name,
        stars: repo.stargazerCount,
        pullRequestsRenovate,
        pullRequestsDependabot,
      });
    }

    hasNextPageRepo = responseRepo.organization.repositories.pageInfo.hasNextPage;
    endCursorRepo = responseRepo.organization.repositories.pageInfo.endCursor;
  }

  return {
    name: organization,
    repositories: repositories.sort((a, b) => b.stars - a.stars),
  };
}
