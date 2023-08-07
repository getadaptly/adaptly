import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function getCommitHistory(repoName: string, branchName: string, octokit: Octokit): Promise<any[]> {
    try {
        const { data: commitHistory } = await octokit.request(`GET /repos/${repoName}/commits`, {
            sha: branchName,
            per_page: 100
        });

        Logger.info('Fetched commit history', { repository: repoName, branchName, response: commitHistory });

        return commitHistory;
    } catch (error) {
        throwGettingCommitHistoryError(error, { repoName, branchName });
    }
}

const throwGettingCommitHistoryError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingCommitHistory), error, context);

    throw new GithubError(ADAPTLY_ERRORS.gettingCommitHistory, context);
};
