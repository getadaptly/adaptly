import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function getFileContent(repoFullName: string, path: string, octokit: Octokit, sha?: string): Promise<string> {
    Logger.info(`Extracting repository file content`, { repository: repoFullName, filePath: path, sha });

    try {
        const url = `GET /repos/${repoFullName}/contents/${path}`;
        const response = await octokit.request(sha ? url + `?ref=${sha}` : url);
        const fileContentBuffer = Buffer.from(response.data.content, 'base64');

        return fileContentBuffer.toString('utf8');
    } catch (error) {
        throwGithubContentError(error, { path });
    }
}

const throwGithubContentError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingFileContent), error, context);

    throw new GithubError(ADAPTLY_ERRORS.gettingFileContent, context);
};
