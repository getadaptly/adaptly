import { Octokit } from '@octokit/core';

import Logger, { getMessage } from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { GithubError } from '@adaptly/errors/types';

export type PrInfo = {
    head: {
        ref: string;
        sha: string;
    };
    base: {
        ref: string;
        sha: string;
    };
};

export async function getPrInfo(repoFullName: string, prNumber: number, octokit: Octokit): Promise<PrInfo> {
    try {
        const response = await octokit.request(`GET /repos/${repoFullName}/pulls/${prNumber}`);
        const prInfo: PrInfo = response.data;

        const commitsResponse = await octokit.request(`GET /repos/${repoFullName}/pulls/${prNumber}/commits`);
        const commits = commitsResponse.data;
        prInfo.base.sha = commits[0].parents[0].sha;

        Logger.info(`Fetched PR information`, { repository: repoFullName, PR: `#${prNumber}`, baseSHA: prInfo.base.sha });

        return prInfo;
    } catch (error) {
        throwPrInfoError(error, { repoFullName, prNumber: prNumber });
    }
}

function throwPrInfoError(error: any, context: any): never {
    Logger.error(getMessage(ADAPTLY_ERRORS.fetchingPrInfo), error, context);
    throw new GithubError(ADAPTLY_ERRORS.fetchingPrInfo, context);
}
