import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';
import { getPrInfo } from '@adaptly/services/github/pulls/getPrInfo';
import { getManifests } from '@adaptly/services/github/pulls/files';
import { DependencyUpdate, getDependenciesUpdated } from './getDependenciesUpdated';
import Logger from '@adaptly/logging/logger';

export async function getPackagesDependenciesUpdated(payload: IssueCommentEvent, octokit: Octokit): Promise<DependencyUpdate[]> {
    const packagesUpdatedDependencies: DependencyUpdate[] = [];

    const prInfo = await getPrInfo(payload, octokit);
    const manifests = await getManifests(payload, octokit);

    for (const manifest of manifests) {
        const dependenciesUpdated = await getDependenciesUpdated(manifest.filename, prInfo, payload, octokit);
        packagesUpdatedDependencies.push(...dependenciesUpdated);
    }

    Logger.info('Updated dependencies', {
        repository: payload.repository.full_name,
        PR: `#${payload.issue.number}`,
        updatedDependencies: packagesUpdatedDependencies
    });

    return packagesUpdatedDependencies;
}
