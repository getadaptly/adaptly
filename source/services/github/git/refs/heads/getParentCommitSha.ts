import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function getParentCommitSha(repoName: string, branchName: string, octokit: Octokit): Promise<string> {
    try {
        const { data } = await octokit.request(`GET /repos/${repoName}/git/refs/heads/${branchName}`);

        const parentCommitSha = data.object.sha;

        Logger.info('Got parent commit sha', { repository: repoName, branchName, parentCommitSha, response: data });

        return parentCommitSha;
    } catch (error) {
        throwGithubParentCommitShaError(error, { repoName, branchName });
    }
}

const throwGithubParentCommitShaError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.fetchingParentCommitSha), error, context);

    throw new GithubError(ADAPTLY_ERRORS.fetchingParentCommitSha, context);
};
