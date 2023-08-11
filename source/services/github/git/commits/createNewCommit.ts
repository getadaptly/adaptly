import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function createNewCommit(
    repoName: string,
    treeSha: string,
    parentCommitSha: string,
    packageName: string,
    packageVersion: string,
    octokit: Octokit
): Promise<string> {
    try {
        const { data } = await octokit.request(`POST /repos/${repoName}/git/commits`, {
            message: `chore(deps): adaptlying the codebase to ${packageName} @ ${packageVersion}`,
            tree: treeSha,
            parents: [parentCommitSha]
        });

        const commitSha = data.sha;

        Logger.info('Created a new commit', { repository: repoName, packageName, packageVersion, treeSha, parentCommitSha });

        return commitSha;
    } catch (error) {
        throwCreatingNewCommitError(error, { repoName, treeSha, parentCommitSha, packageName, packageVersion });
    }
}

const throwCreatingNewCommitError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.creatingNewCommit), error, context);

    throw new GithubError(ADAPTLY_ERRORS.creatingNewCommit, context);
};
