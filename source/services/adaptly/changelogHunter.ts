import { getEnv } from '../../env';
import axios, { AxiosResponse } from 'axios';
import { URL } from 'url';

import Logger, { getMessage } from '@adaptly/logging/logger';
import { GITHUB_API_URL } from '@adaptly/consts';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';

export const getChangelog = async (githubRepoUrl: string, targetVersion: string, packageName: string): Promise<string> => {
    const accessToken = getEnv('GITHUB_ACCESS_TOKEN');

    try {
        const releaseNotes = await getReleaseNotes(githubRepoUrl, accessToken, targetVersion);
        return releaseNotes;
    } catch (error) {
        Logger.info('Could not catch release notes for version, trying to get release notes with package name in version');
    }

    const releaseNotes = await getReleaseNotesPackageNameInVersion(githubRepoUrl, accessToken, targetVersion, packageName);
    return releaseNotes;
};

const getReleaseNotes = async (githubRepoUrl: string, accessToken: string, targetVersion: string): Promise<string> => {
    Logger.info(`Looking for release notes in ${githubRepoUrl} for ${targetVersion}`);

    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    const releaseUrl = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/releases/tags/${targetVersion}`;

    const response: AxiosResponse = await fetchReleaseNotes(releaseUrl, accessToken);

    return response.data.body;
};

const getReleaseNotesPackageNameInVersion = async (
    githubRepoUrl: string,
    accessToken: string,
    targetVersion: string,
    packageName: string
): Promise<string> => {
    Logger.info(`Looking for release notes in ${githubRepoUrl} for ${targetVersion}`);

    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    const releaseUrl = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/releases/tags/${packageName}@${targetVersion}`;

    const response: AxiosResponse = await fetchReleaseNotes(releaseUrl, accessToken);

    return response.data.body;
};

export function getRepoOwnerAndName(githubRepoUrl: string): { repoOwner: string; repoName: string } {
    const parsedUrl = new URL(githubRepoUrl);
    const pathParts = parsedUrl.pathname.split('/').filter((part) => part.length > 0);

    const [repoOwner, repoName] = [pathParts[0], pathParts[1].replace('.git', '')];

    return { repoOwner, repoName };
}

async function fetchReleaseNotes(releaseUrl: string, accessToken: string): Promise<AxiosResponse> {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json'
    };

    try {
        const response: AxiosResponse = await axios.get(releaseUrl, { headers });

        return response;
    } catch (error) {
        throwGettingReleasesError(error, { releaseUrl });
    }
}

const throwGettingReleasesError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingReleaseNotes), error, context);
    throw new GithubError(ADAPTLY_ERRORS.gettingReleaseNotes, context);
};
