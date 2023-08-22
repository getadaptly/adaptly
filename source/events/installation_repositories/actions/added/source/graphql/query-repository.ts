import Logger from '@adaptly/logging/logger';
import { runQuery } from '@adaptly/services/github/graphql/client';
import { GitHubPullRequest, QueryPullRequestsReturn, QueryPullRequests } from '@adaptly/services/github/graphql/queries/pull-requests';
import { GitHubRepository, QueryRepository, queryRepository } from '@adaptly/services/github/graphql/queries/repository';

export async function getRepositoryBotPRs(organisation: string, repository: string): Promise<GitHubPullRequest[]> {
    const response = await runQuery<QueryRepository>(queryRepository, {
        owner: organisation,
        name: repository
    });

    const botPRs = await getBotPRs(organisation, response.repository);

    return botPRs;
}

async function getBotPRs(organization: string, repo: GitHubRepository): Promise<GitHubPullRequest[]> {
    Logger.info(`Fetching organization repository "${organization}/${repo.name}" PRs\n\n`);

    let hasMorePRs = true;
    let cursorPR: string | null = null;

    const botPRs: GitHubPullRequest[] = [];

    while (hasMorePRs) {
        const { pullRequests, hasNextPage, endCursor } = await getPRsBatch(organization, repo.name, cursorPR);

        botPRs.push(...pullRequests);

        hasMorePRs = hasNextPage;
        cursorPR = endCursor;
    }

    botPRs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('---------------------\n');

    return botPRs;
}

async function getPRsBatch(
    organization: string,
    repoName: string,
    after: string | null
): Promise<{ pullRequests: GitHubPullRequest[]; hasNextPage: boolean; endCursor: string }> {
    const pullRequests: GitHubPullRequest[] = [];

    const response = await runQuery<QueryPullRequestsReturn>(QueryPullRequests, {
        organization,
        repoName,
        after
    });

    const botPRs = response.repository.pullRequests.nodes.filter(
        (pr) => pr.author && (pr.author.login === 'renovate' || pr.author.login === 'dependabot')
    );

    pullRequests.push(...botPRs.map(formatPullRequest));

    const hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
    const endCursor = response.repository.pullRequests.pageInfo.endCursor;

    return { pullRequests, hasNextPage, endCursor };
}

function formatPullRequest(pr: QueryPullRequestsReturn['repository']['pullRequests']['nodes'][number]): GitHubPullRequest {
    return {
        title: pr.title,
        number: pr.number,
        body: pr.body,
        url: pr.url,
        merged: pr.merged,
        state: pr.state,
        createdAt: pr.createdAt,
        closedAt: pr.closedAt,
        mergedAt: pr.mergedAt,
        author: { login: pr.author.login },
        mergedBy: pr.mergedBy ? { login: pr.mergedBy.login, url: pr.mergedBy.url } : undefined
    };
}
