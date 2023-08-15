import { getEnv } from '../../env';
import axios, { AxiosResponse } from 'axios';
import { URL } from 'url';

import Logger, { getMessage } from '@adaptly/logging/logger';
import { GITHUB_API_URL } from '@adaptly/consts';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { getFileContent } from '../github/contents/getContentFile';
import { Octokit } from '@octokit/core';
import { extractVersionChanges } from './extractVersionChanges';

export const getChangelog = async (githubRepoUrl: string, targetVersion: string, packageName: string, octokit: Octokit): Promise<string> => {
    const accessToken = getEnv('GITHUB_ACCESS_TOKEN');

    // note(Lauris): We need to try every possible way to fetch release notes because even if some of the version is
    // prefixed with, for example, 'v', then it might be that some other is not. If all versions are prefixed, then they will come in already
    // formatted with the prefix, so the first try below will succeed.
    try {
        const releaseNotes = await getReleaseNotes(githubRepoUrl, accessToken, targetVersion);
        return releaseNotes;
    } catch (error) {
        Logger.info(`getChangelog: Could not fetch release notes for version: ${targetVersion}`);
    }

    try {
        Logger.info('getChangelog: Trying to fetch with v prefix');
        const releaseNotes = await getReleaseNotesWithPrefix(githubRepoUrl, accessToken, targetVersion, 'v');
        return releaseNotes;
    } catch (error) {
        Logger.info(`getChangelog: Could not fetch release notes for version with v prefix v${targetVersion}`);
    }

    try {
        Logger.info('getChangelog: Trying to fetch with package name prefix');
        const releaseNotes = await getReleaseNotesWithPrefix(githubRepoUrl, accessToken, targetVersion, `${packageName}@`);
        return releaseNotes;
    } catch (error) {
        Logger.info(`getChangelog: Could not fetch release notes for version with package name prefix ${packageName}@${targetVersion}`);
    }

    try {
        Logger.info('getChangelog: Trying to fetch changelog file');
        const releaseNotes = await getChangelogMd(githubRepoUrl, targetVersion, octokit);
        return releaseNotes;
    } catch (error) {
        Logger.info(`getChangelog: Could not fetch ${packageName} release notes`);
        throw error;
    }
};

const getReleaseNotes = async (githubRepoUrl: string, accessToken: string, targetVersion: string): Promise<string> => {
    Logger.info(`Looking for release notes in ${githubRepoUrl} for ${targetVersion}`);

    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    const releaseUrl = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/releases/tags/${targetVersion}`;

    const response: AxiosResponse = await fetchReleaseNotes(releaseUrl, accessToken);

    return response.data.body;
};

const getReleaseNotesWithPrefix = async (githubRepoUrl: string, accessToken: string, targetVersion: string, prefix: string): Promise<string> => {
    Logger.info(`Looking for release notes in ${githubRepoUrl} for ${targetVersion}`);

    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    const releaseUrl = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/releases/tags/${prefix}${targetVersion}`;

    const response: AxiosResponse = await fetchReleaseNotes(releaseUrl, accessToken);

    return response.data.body;
};

async function getChangelogMd(githubRepoUrl: string, targetVersion: string, octokit: Octokit): Promise<string> {
    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    try {
        const content = await getFileContent(`${repoOwner}/${repoName}`, 'CHANGELOG.md', octokit);
        const versionChanges = extractVersionChanges(content, targetVersion);
        return versionChanges;
    } catch (error) {
        Logger.info("Couldn't find CHANGELOG.md");
    }

    try {
        const content = await getFileContent(`${repoOwner}/${repoName}`, 'changelog.md', octokit);
        const versionChanges = extractVersionChanges(content, targetVersion);
        return versionChanges;
    } catch (error) {
        Logger.info("Couldn't find changelog.md");
    }

    try {
        const content = await getFileContent(`${repoOwner}/${repoName}`, 'CHANGES.md', octokit);
        const versionChanges = extractVersionChanges(content, targetVersion);
        return versionChanges;
    } catch (error) {
        Logger.info("Couldn't find CHANGES.md");
    }

    try {
        const content = await getFileContent(`${repoOwner}/${repoName}`, 'changes.md', octokit);
        const versionChanges = extractVersionChanges(content, targetVersion);
        return versionChanges;
    } catch (error) {
        Logger.info("Couldn't find changes.md");
        throw error;
    }
}

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
