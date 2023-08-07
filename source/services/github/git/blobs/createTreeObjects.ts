import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { File } from '@adaptly/services/adaptly/importsFinder';

export async function createTreeObjects(repoName: string, updatedFiles: File[], baseTreeSha: string, octokit: Octokit): Promise<any[]> {
    try {
        const tree = await Promise.all(
            updatedFiles.map(async (file) => {
                const {
                    data: { sha }
                } = await octokit.request(`POST /repos/${repoName}/git/blobs`, {
                    content: file.content,
                    encoding: 'utf-8'
                });
                return {
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    sha
                };
            })
        );

        Logger.info('Created tree objects', { repository: repoName, updatedFiles, baseTreeSha, response: tree });
        return tree;
    } catch (error) {
        throwCreatingTreeObjectsError(error, { repoName, updatedFiles, baseTreeSha });
    }
}

const throwCreatingTreeObjectsError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.creatingTreeObjects), error, context);

    throw new GithubError(ADAPTLY_ERRORS.creatingTreeObjects, context);
};
