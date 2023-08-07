import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { createTreeObjects } from '../blobs/createTreeObjects';
import { getParentCommitSha } from '../refs/heads/getParentCommitSha';
import { updateBranchReference } from '../refs/heads/updateBranchReference';
import { createNewTree } from '../trees/createNewTree';
import { createNewCommit } from './createNewCommit';
import { File } from '@adaptly/services/adaptly/importsFinder';

export async function createCommitAndPushChanges(
    pullRequestUrl: string,
    repoName: string,
    branchName: string,
    updatedFiles: File[],
    packageName: string,
    packageVersion: string,
    octokit: Octokit
): Promise<void> {
    try {
        if (updatedFiles.length === 0) {
            Logger.info(`No updated files were passed to commit so skipping`, { repository: repoName, branchName });
            return;
        }

        const parentCommitSha = await getParentCommitSha(repoName, branchName, octokit);

        // Get the base tree SHA from the parent commit
        const {
            data: {
                tree: { sha: baseTreeSha }
            }
        } = await octokit.request(`GET /repos/${repoName}/git/commits/${parentCommitSha}`);

        const tree = await createTreeObjects(repoName, updatedFiles, baseTreeSha, octokit);

        const treeSha = await createNewTree(repoName, tree, baseTreeSha, octokit);

        const commitSha = await createNewCommit(repoName, treeSha, parentCommitSha, packageName, packageVersion, octokit);

        await updateBranchReference(repoName, branchName, commitSha, false, octokit);

        Logger.info('Committed and pushed PR changes', { repoName, branchName, commitSha });
    } catch (error) {
        throwCreatingAndPushingChangesError(error, { pullRequestUrl, repoName, branchName, updatedFiles, packageName, packageVersion });
    }
}

const throwCreatingAndPushingChangesError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.creatingAndPushingChanges), error, context);

    throw new GithubError(ADAPTLY_ERRORS.creatingAndPushingChanges, context);
};
