import { getRepoOwnerAndName } from '@adaptly/services/adaptly/changelogHunter';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export function getProgressMessage(dependencyUpdate: DependencyUpdate): string {
    const cursorVersionIndex = dependencyUpdate.intermediaryVersions.indexOf(dependencyUpdate.cursorVersion);
    const versionsCount = dependencyUpdate.intermediaryVersions.length - 1;

    return `\n>${cursorVersionIndex} / ${versionsCount} versions between ${dependencyUpdate.currentVersion} and ${dependencyUpdate.targetVersion} checked\n`;
}

export async function getReleaseUrl(githubRepoUrl: string, version: string): Promise<string> {
    const { repoOwner, repoName } = getRepoOwnerAndName(githubRepoUrl);

    const releaseUrl = `https://github.com/${repoOwner}/${repoName}/releases/tag/${version}`;

    return releaseUrl;
}
