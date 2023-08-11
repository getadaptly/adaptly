import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function createNewTree(repoName: string, tree: any[], baseTreeSha: string, octokit: Octokit): Promise<string> {
    try {
        const { data } = await octokit.request(`POST /repos/${repoName}/git/trees`, {
            tree,
            base_tree: baseTreeSha
        });

        const treeSha = data.sha;

        Logger.info('Created a new tree', { repository: repoName, tree, baseTreeSha });

        return treeSha;
    } catch (error) {
        throwCreatingNewTreeError(error, { repoName, tree, baseTreeSha });
    }
}

const throwCreatingNewTreeError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.creatingNewTree), error, context);

    throw new GithubError(ADAPTLY_ERRORS.creatingNewTree, context);
};
