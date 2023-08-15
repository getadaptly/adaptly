import Logger, { getMessage } from '@adaptly/logging/logger';
import semver from 'semver';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import axios from 'axios';
import { getRepoOwnerAndName } from '@adaptly/services/adaptly/changelogHunter';
import { Octokit } from '@octokit/core';
import { NPM_API_URL } from '@adaptly/consts';

// note(Lauris): with range is meant:
// Including currentVersion, all versions between
// currentVersion and targetVersion, and targetVersion.

export async function getVersionsRange(
    packageName: string,
    dependecyRepoUrl: string,
    currentVersion: string,
    targetVersion: string,
    octokit: Octokit
): Promise<{ versionsRange: string[]; prefix: string }> {
    try {
        let versionsRange: string[] = [];

        const { repoOwner, repoName } = getRepoOwnerAndName(dependecyRepoUrl);
        const prefix = await getPrefix(repoOwner, repoName, packageName, octokit);

        const response = await axios.get(`${NPM_API_URL}/${packageName}`);
        let versions = Object.keys(response.data.versions);

        for (let version of versions) {
            if (semver.prerelease(version)) {
                continue;
            }

            const isCurrentVersion = semver.eq(version, currentVersion);
            const isBetween = semver.gt(version, currentVersion) && semver.lt(version, targetVersion);
            const isTargetVersion = semver.eq(version, targetVersion);

            if (isCurrentVersion || isBetween || isTargetVersion) {
                // note(Lauris): npm registry returned versions that are not in github releases
                if (isBetween && (await versionExistsInGithubReleases(repoOwner, repoName, packageName, prefix, version, octokit))) {
                    versionsRange.push(version);
                } else {
                    versionsRange.push(version);
                }
            }

            if (isTargetVersion) {
                break;
            }
        }

        if (prefix) {
            versionsRange = versionsRange.map((version) => `${prefix}${version}`);
        }

        Logger.info(`Got dependency intermediary versions between current and target versions `, {
            dependency: packageName,
            currentVersion,
            targetVersion,
            versionsRange
        });

        return { versionsRange, prefix };
    } catch (error) {
        throwGithubReleasesError(error);
    }
}

type Release = {
    tag_name: string;
    prerelease: boolean;
};

async function versionExistsInGithubReleases(
    repoOwner: string,
    repoName: string,
    packageName: string,
    prefix: string,
    version: string,
    octokit: Octokit
): Promise<boolean> {
    if (prefix) {
        try {
            await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases/tags/${prefix}${version}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    try {
        await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases/tags/${version}`);
        return true;
    } catch (error) {}

    try {
        await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases/tags/v${version}`);
        return true;
    } catch (error) {}

    try {
        await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases/tags/${packageName}@${version}`);
        return true;
    } catch (error) {}

    return false;
}

async function getPrefix(repoOwner: string, repoName: string, dependency: string, octokit: Octokit): Promise<string> {
    const releases: Release[] = [];

    let page = 1;
    while (true) {
        if (page > 100) {
            break;
        }

        const response = await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases?page=${page}&per_page=100`);

        if (response.data.length === 0) {
            break;
        }

        const responseData = response.data as Release[];
        releases.push(...responseData);

        page++;
    }

    const isVersionPrefixedV = releases.every((version) => version.tag_name.startsWith('v'));
    const isVersionPrefixedPackage = releases.every((version) => version.tag_name.startsWith(`${dependency}@`));

    if (isVersionPrefixedV) {
        return 'v';
    }

    if (isVersionPrefixedPackage) {
        return `${dependency}@`;
    }

    return '';
}

const throwGithubReleasesError: ErrorHandler = (error: any, context: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingReleases), error);

    throw new GithubError(ADAPTLY_ERRORS.gettingReleases);
};
