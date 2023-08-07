import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { RefactorsReport } from '../refactors';
import { getRefactorsLoadingCommentId } from '../refactors/report';
import { getReleaseUrl, getProgressMessage } from './body';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { updateComment } from '@adaptly/services/github/issues/comments/updateComment';
import Logger from '@adaptly/logging/logger';
import { findRepository } from '@adaptly/database/operations/repository/read';
import { updatePullRequest } from '@adaptly/database/operations/pull-request/update';

export async function approvePr(reports: RefactorsReport[], payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    const canApprovePr = reports.every((report) => report.refactors.length === 0);

    if (!canApprovePr) {
        return;
    }

    const message = await getApprovalMessage(reports);
    const loadingCommentId = await getRefactorsLoadingCommentId(payload, octokit);

    if (loadingCommentId) {
        await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
    } else {
        await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
    }

    Logger.info('Approved PR', { repository: payload.repository.full_name, PR: `${payload.issue.number}` });

    await approveDatabasePullRequest(payload.repository.full_name, payload.issue.number);
}

async function getApprovalMessage(reports: RefactorsReport[]): Promise<string> {
    let message = `:white_check_mark:&nbsp;&nbsp;No refactors found! This PR looks good to me!\n\n`;

    let counter = 1;

    for (const report of reports) {
        const dependencyName = report.dependencyUpdate.dependencyName;
        const cursorVersion = report.dependencyUpdate.cursorVersion;

        const releaseUrl = await getReleaseUrl(report.dependencyUpdate.dependencyRepoUrl, cursorVersion);

        message += `\nPackage: [${dependencyName}](${report.dependencyUpdate.dependencyUrl})\nVersion: [${cursorVersion}](${releaseUrl})\n`;

        message += getProgressMessage(report.dependencyUpdate);

        if (counter < reports.length) {
            message += `---\n`;
        }

        counter++;
    }

    return message;
}

async function approveDatabasePullRequest(repositoryFullName: string, pullRequestNumber: number): Promise<void> {
    const repository = await findRepository(repositoryFullName);

    await updatePullRequest(repository.id, pullRequestNumber, { adaptlyApproved: true });
}
