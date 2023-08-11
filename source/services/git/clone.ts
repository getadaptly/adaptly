import { Octokit } from '@octokit/core';
import git from 'simple-git';
import fs from 'fs';
import util from 'util';
import path from 'path';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { AdaptlyError, ErrorHandler } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';

const rmdir = util.promisify(fs.rm);

export async function clone(repoName: string, installationId: number, destinationPath: string, octokit: Octokit): Promise<void> {
    const { data } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installationId
    });

    const installationToken = data.token;

    try {
        await deleteClonedRepository(destinationPath);

        await git().clone(`https://x-access-token:${installationToken}@github.com/${repoName}.git`, destinationPath);

        Logger.info('Repository cloned locally', { repoName, destinationPath });
    } catch (error) {
        throwCloneError(error, { repoName, destinationPath });
    }
}

async function deleteClonedRepository(destinationPath: string): Promise<void> {
    if (fs.existsSync(destinationPath)) {
        await rmdir(destinationPath, { recursive: true });
    }
}

const tmp = path.resolve(__dirname, '../../../tmp');

export function getCloneDestinationPath(repoName: string): string {
    return path.join(tmp, repoName);
}

const throwCloneError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.repoCloneError), error, context);

    throw new AdaptlyError(ADAPTLY_ERRORS.repoCloneError, context);
};
