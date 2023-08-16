import { Octokit } from '@octokit/core';
import { getPrInfo } from '@adaptly/services/github/pulls/getPrInfo';
import { getManifests } from '@adaptly/services/github/pulls/files';
import { DependencyUpdate, getDependenciesUpdated } from './getDependenciesUpdated';
import Logger from '@adaptly/logging/logger';

export async function getPackagesDependenciesUpdated(repoFullName: string, prNumber: number, octokit: Octokit): Promise<DependencyUpdate[]> {
    const packagesUpdatedDependencies: DependencyUpdate[] = [];
    const uniqueBumps = new Set<string>(); // Set to store unique package-version bumps

    const prInfo = await getPrInfo(repoFullName, prNumber, octokit);
    const manifests = await getManifests(repoFullName, prNumber, octokit);

    for (const manifest of manifests) {
        const dependenciesUpdated = await getDependenciesUpdated(manifest.filename, prInfo, repoFullName, prNumber, uniqueBumps, octokit);
        packagesUpdatedDependencies.push(...dependenciesUpdated);
    }

    Logger.info('Updated dependencies', {
        repository: repoFullName,
        PR: `#${prNumber}`,
        updatedDependencies: packagesUpdatedDependencies
    });

    return packagesUpdatedDependencies;
}
