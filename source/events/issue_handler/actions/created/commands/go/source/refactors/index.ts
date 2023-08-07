import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Refactor, findRefactors } from './findRefactors';
import Logger from '@adaptly/logging/logger';
import { BreakingChangesReport } from '../breaking-changes';

export type RefactorsReport = BreakingChangesReport & {
    refactors: Refactor[];
};

export async function getRefactorsReports(
    breakingChangesReports: BreakingChangesReport[],
    payload: IssueCommentEvent,
    octokit: Octokit
): Promise<RefactorsReport[]> {
    const reports: RefactorsReport[] = [];

    for (const report of breakingChangesReports) {
        const refactors = await findRefactors(report.dependencyUpdate, report.breakingChanges, payload, octokit);

        reports.push({
            ...report,
            refactors
        });
    }

    Logger.info(`Prepared refactors reports`, { repository: payload.repository.full_name, PR: `#${payload.issue.number}`, reports });

    return reports;
}
