import Logger, { getMessage } from '@adaptly/logging/logger';
import semver from 'semver';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import axios from 'axios';
import { getRepoOwnerAndName } from '@adaptly/services/adaptly/changelogHunter';
import { Octokit } from '@octokit/core';

// note(Lauris): with range is meant:
// Including currentVersion, all versions between
// currentVersion and targetVersion, and targetVersion.

export async function getVersionsRange(
    packageName: string,
    dependecyRepoUrl: string,
    currentVersion: string,
    targetVersion: string,
    octokit: Octokit
): Promise<string[]> {
    try {
        let versionsRange: string[] = [];

        const { repoOwner, repoName } = getRepoOwnerAndName(dependecyRepoUrl);

        const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const versions = Object.keys(response.data.versions);

        for (let version of versions) {
            if (semver.prerelease(version)) {
                continue;
            }

            const isCurrentVersion = semver.eq(version, currentVersion);
            const isBetween = semver.gt(version, currentVersion) && semver.lt(version, targetVersion);
            const isTargetVersion = semver.eq(version, targetVersion);

            if (isCurrentVersion || isBetween || isTargetVersion) {
                try {
                    // note(Lauris): npm registry returned versions that are not in github releases
                    if (isBetween) {
                        await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases/tags/${version}`);
                    }
                    versionsRange.push(version);
                } catch (error) {
                    continue;
                }
            }

            if (isTargetVersion) {
                break;
            }
        }

        Logger.info(`Got dependency intermediary versions between current and target versions `, {
            dependency: packageName,
            currentVersion,
            targetVersion,
            versionsRange: versionsRange
        });

        return versionsRange;
    } catch (error) {
        throwGithubReleasesError(error);
    }
}

const throwGithubReleasesError: ErrorHandler = (error: any, context: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingReleases), error);

    throw new GithubError(ADAPTLY_ERRORS.gettingReleases);
};
