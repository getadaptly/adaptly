import { getFileContent } from '@adaptly/services/github/contents/getContentFile';
import { PrInfo } from '@adaptly/services/github/pulls/getPrInfo';
import { getVersionsRange } from '@adaptly/services/github/releases/getVersionsRange';
import Logger from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { ParserFactory } from '@adaptly/services/adaptly/dependencyParser';
import { retrieveDependencyUpdate } from '@adaptly/database/operations/dependency-update/read';
import semver from 'semver';
import path from 'path';

export type DependencyUpdate = {
    dependencyName: string;
    dependencyRepoUrl: string;
    dependencyUrl: string;
    currentVersion: string;
    cursorVersion: string;
    targetVersion: string;
    intermediaryVersions: string[];
    dirName: string;
    manifestFilename: string;
};

export async function getDependenciesUpdated(
    manifestFilename: string,
    prInfo: PrInfo,
    repoFullName: string,
    prNumber: number,
    octokit: Octokit
): Promise<DependencyUpdate[]> {
    Logger.info(`Getting dependencies updated for ${repoFullName} in #${prNumber}`);
    const parser = ParserFactory.getParser(manifestFilename);

    // HEAD: PR branch
    // BASE: the branch the PR is trying to merge into (master, main, dev)
    const manifestHead = await getFileContent(repoFullName, manifestFilename, octokit, prInfo.head.sha);
    const manifestBase = await getFileContent(repoFullName, manifestFilename, octokit, prInfo.base.sha);

    const dependenciesHead = parser.parseDependencies(manifestHead);
    const dependenciesBase = parser.parseDependencies(manifestBase);

    const updatedDependencies: DependencyUpdate[] = [];

    const baseDependencies = Object.keys(dependenciesBase);

    for (let dependency of baseDependencies) {
        if (dependenciesHead[dependency]) {
            if (dependenciesHead[dependency] !== dependenciesBase[dependency]) {
                const dependencyUpdateInDatabase = await retrieveDependencyUpdate(dependency, prNumber, repoFullName);

                const currentVersion = dependenciesBase[dependency];
                const cursorVersion = dependencyUpdateInDatabase ? dependencyUpdateInDatabase.cursorVersion : currentVersion;
                const targetVersion = dependenciesHead[dependency];

                Logger.info(`Found an update for ${dependency} from ${currentVersion} to ${targetVersion}`);

                const dependencyRepoUrl = await parser.getDependencyRepoUrl(dependency);
                const dependencyUrl = parser.getDependencyUrl(dependency);
                const versionsRange = await getVersionsRange(
                    dependency,
                    dependencyRepoUrl,
                    dependenciesBase[dependency],
                    dependenciesHead[dependency],
                    octokit
                );

                const isVersionPrefixed = versionsRange.some((version) => version.startsWith('v'));

                const currentVersionFormatted = isVersionPrefixed ? formatVersion(currentVersion) : currentVersion;
                const cursorVersionFormatted = isVersionPrefixed ? formatVersion(cursorVersion) : cursorVersion;
                const targetVersionFormatted = isVersionPrefixed ? formatVersion(targetVersion) : targetVersion;
                const versionsRangeFormatted = isVersionPrefixed ? formatVersions(versionsRange) : versionsRange;

                updatedDependencies.push({
                    dependencyName: dependency,
                    dependencyRepoUrl: dependencyRepoUrl,
                    dependencyUrl: dependencyUrl,
                    currentVersion: currentVersionFormatted,
                    cursorVersion: cursorVersionFormatted,
                    targetVersion: targetVersionFormatted,
                    intermediaryVersions: versionsRangeFormatted,
                    dirName: getPackageDirectory(manifestFilename),
                    manifestFilename
                });
            }
        }
    }

    return updatedDependencies;
}

function formatVersions(versions: string[]): string[] {
    return versions.map((version) => formatVersion(version));
}

function formatVersion(version: string): string {
    return version.startsWith('v') ? version : `v${version}`;
}

function getPackageDirectory(manifestFilename: string): string {
    return path.dirname(manifestFilename);
}
