import { getRepoOwnerAndName } from '@adaptly/services/adaptly/changelogHunter';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import semver from 'semver';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';

type Release = {
    tag_name: string;
    prerelease: boolean;
};

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
    let fetching = true;

    const { repoOwner, repoName } = getRepoOwnerAndName(dependecyRepoUrl);

    let page = 1;

    let versions: string[] = [];
    let push = false;

    try {
        while (fetching) {
            const response = await octokit.request(`GET /repos/${repoOwner}/${repoName}/releases?page=${page}&per_page=20`);
            const data = response.data as Release[];

            const releases = data.map((release: any) => {
                return { tag_name: release.tag_name, prerelease: release.prerelease };
            });

            for (let release of releases) {
                if (release.prerelease) {
                    continue;
                }

                const isTargetVersion = semver.eq(release.tag_name, targetVersion);
                const isAfterCurrentVersion = semver.gt(release.tag_name, currentVersion);
                const isCurrentVersion = semver.eq(release.tag_name, currentVersion);

                if (isTargetVersion) {
                    push = true;
                }

                if (push && isAfterCurrentVersion) {
                    versions.push(release.tag_name);
                }

                if (isCurrentVersion) {
                    versions.push(release.tag_name);
                    fetching = false;
                    break;
                }
            }

            page++;
        }

        Logger.info(`Got dependency intermediary versions between current and target versions `, {
            dependency: packageName,
            currentVersion,
            targetVersion,
            intermediaryVersions: versions
        });

        return versions.reverse();
    } catch (error) {
        throwGithubReleasesError(error);
    }
}

const throwGithubReleasesError: ErrorHandler = (error: any, context: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.gettingReleases), error);

    throw new GithubError(ADAPTLY_ERRORS.gettingReleases);
};
