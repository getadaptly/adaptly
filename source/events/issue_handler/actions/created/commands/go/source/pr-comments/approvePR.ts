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
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export async function approvePr(reports: RefactorsReport[], payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    const canApprovePr = reports.every((report) => report.refactors.length === 0);

    if (!canApprovePr) {
        return;
    }

    const message = await getApprovalMessage(reports.map((report) => report.dependencyUpdate));
    const loadingCommentId = await getRefactorsLoadingCommentId(payload, octokit);

    if (loadingCommentId) {
        await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
    } else {
        await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
    }

    Logger.info('Approved PR', { repository: payload.repository.full_name, PR: `${payload.issue.number}` });

    await approveDatabasePullRequest(payload.repository.full_name, payload.issue.number);
}

export async function getApprovalMessage(dependencyUpdates: DependencyUpdate[]): Promise<string> {
    let message = `:white_check_mark:&nbsp;&nbsp;All versions checked successfully! This PR looks good to me!\n\n`;

    let counter = 1;

    for (const update of dependencyUpdates) {
        const dependencyName = update.dependencyName;
        const cursorVersion = update.cursorVersion;

        const releaseUrl = await getReleaseUrl(update.dependencyRepoUrl, cursorVersion);

        message += `\nPackage: [${dependencyName}](${update.dependencyUrl})\nTarget version reached: [${cursorVersion}](${releaseUrl})\n`;

        message += getProgressMessage(update);

        if (counter < dependencyUpdates.length) {
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
