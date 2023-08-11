import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function updateBranchReference(
    repoName: string,
    branchName: string,
    commitSha: string,
    force: boolean,
    octokit: Octokit
): Promise<void> {
    try {
        const { data } = await octokit.request(`PATCH /repos/${repoName}/git/refs/heads/${branchName}`, {
            sha: commitSha,
            force: force
        });

        Logger.info('Updated branch reference', { repository: repoName, branchName, commitSha, force });
    } catch (error) {
        throwUpdatingBranchReferenceError(error, { repoName, branchName, commitSha, force });
    }
}

const throwUpdatingBranchReferenceError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.updatingBranchReference), error, context);

    throw new GithubError(ADAPTLY_ERRORS.updatingBranchReference, context);
};
