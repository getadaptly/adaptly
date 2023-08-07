import { IssueCommentEvent } from '@octokit/webhooks-types';
import { BreakingChange, findBreakingChanges } from './findBreakingChanges';
import Logger from '@adaptly/logging/logger';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export type BreakingChangesReport = {
    dependencyUpdate: DependencyUpdate;
    breakingChanges: BreakingChange[];
};

export async function getBreakingChangesReports(
    updatedDependencies: DependencyUpdate[],
    payload: IssueCommentEvent
): Promise<BreakingChangesReport[]> {
    const reports: BreakingChangesReport[] = [];

    for (const update of updatedDependencies) {
        const breakingChanges = await findBreakingChanges(update);

        reports.push({
            dependencyUpdate: {
                ...update,
                cursorVersion: breakingChanges.cursorVersion
            },
            breakingChanges: breakingChanges.changes
        });
    }

    Logger.info(`Prepared breaking changes reports`, {
        repository: payload.repository.full_name,
        PR: `#${payload.issue.number}`,
        reports
    });

    return reports;
}
