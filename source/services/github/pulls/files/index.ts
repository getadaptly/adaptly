import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ParserFactory } from '@adaptly/services/adaptly/dependencyParser';

type PrFile = {
    filename: string;
};

export async function getManifests(payload: IssueCommentEvent, octokit: Octokit): Promise<PrFile[]> {
    const repoFullName = payload.repository.full_name;
    const prId = payload.issue.number;

    let page = 1;

    const manifestFiles: PrFile[] = [];

    // List of supported manifest files
    const manifestNames = ParserFactory.getSupportedManifests();

    try {
        while (true) {
            const response = await octokit.request(`GET /repos/${repoFullName}/pulls/${prId}/files?per_page=50&page=${page}`);

            const data: PrFile[] = response.data;

            if (data.length === 0) {
                break;
            }

            for (const file of data) {
                // Check if file is a supported manifest file
                if (manifestNames.some((regex) => regex.test(file.filename))) {
                    manifestFiles.push(file);
                }
            }

            page += 1;
        }

        Logger.info(`Extracted repository manifest files`, { repository: repoFullName, PR: `#${prId}`, manifestFiles });
        return manifestFiles;
    } catch (error) {
        throwManifestError(error);
    }
}

const throwManifestError: ErrorHandler = (error: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingManifest), error);

    throw new GithubError(ADAPTLY_ERRORS.gettingManifest);
};
