import { IssueCommentEvent } from '@octokit/webhooks-types';
import { BreakingChange, findBreakingChanges } from './findBreakingChanges';
import Logger from '@adaptly/logging/logger';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';
import { Octokit } from '@octokit/core';

export type BreakingChangesReport = {
    dependencyUpdate: DependencyUpdate;
    breakingChanges: BreakingChange[];
};

export async function getBreakingChangesReports(updatedDependencies: DependencyUpdate[], octokit: Octokit): Promise<BreakingChangesReport[]> {
    const reports: BreakingChangesReport[] = [];

    for (const update of updatedDependencies) {
        const breakingChanges = await findBreakingChanges(update, octokit);

        reports.push({
            dependencyUpdate: {
                ...update,
                cursorVersion: breakingChanges.cursorVersion
            },
            breakingChanges: breakingChanges.changes
        });
    }

    return reports;
}
