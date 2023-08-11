import { Octokit } from '@octokit/core';
import git from 'simple-git';
import fs from 'fs';
import util from 'util';
import path from 'path';
import Logger from '@adaptly/logging/logger';

const rmdir = util.promisify(fs.rm);

export async function clone(repoName: string, installationId: number, destinationPath: string, octokit: Octokit): Promise<void> {
    const { data } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installationId
    });

    const installationToken = data.token;

    try {
        await deleteClonedRepository(destinationPath);

        const response = await git().clone(`https://x-access-token:${installationToken}@github.com/${repoName}.git`, destinationPath);

        Logger.info('Repository cloned locally', { repoName, destinationPath });
    } catch (err) {
        console.error('failed: ', err);
    }
}

async function deleteClonedRepository(destinationPath: string): Promise<void> {
    try {
        if (fs.existsSync(destinationPath)) {
            await rmdir(destinationPath, { recursive: true });
        }
    } catch (err) {
        console.error('failed: ', err);
    }
}

const tmp = path.resolve(__dirname, '../../../tmp');

export function getCloneDestinationPath(repoName: string): string {
    return path.join(tmp, repoName);
}
