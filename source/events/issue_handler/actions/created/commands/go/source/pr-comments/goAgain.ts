import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { RefactorsReport } from '../refactors';
import { getRefactorsLoadingCommentId } from '../refactors/report';
import { getReleaseUrl, getProgressMessage } from './body';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { updateComment } from '@adaptly/services/github/issues/comments/updateComment';
import Logger from '@adaptly/logging/logger';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export async function goAgain(reports: RefactorsReport[], payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    const message = await getContinueMessage(reports.map((report) => report.dependencyUpdate));
    const loadingCommentId = await getRefactorsLoadingCommentId(payload, octokit);

    if (loadingCommentId) {
        await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
    } else {
        await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
    }

    Logger.info('Go again on PR', { repository: payload.repository.full_name, PR: `${payload.issue.number}` });
}

export async function getContinueMessage(dependencyUpdates: DependencyUpdate[]): Promise<string> {
    let message = `:arrows_counterclockwise:&nbsp;&nbsp;No refactors found given the changelog breaking changes.\n\nDouble check the breaking changes in changelog, and if all is good, run \`/adaptly go\` to continue.\n\n`;

    let counter = 1;

    for (const update of dependencyUpdates) {
        const dependencyName = update.dependencyName;
        const cursorVersion = update.cursorVersion;

        const releaseUrl = await getReleaseUrl(update.dependencyRepoUrl, cursorVersion);

        message += `\nPackage: [${dependencyName}](${update.dependencyUrl})\nVersion: [${cursorVersion}](${releaseUrl})\n`;

        message += getProgressMessage(update);

        if (counter < dependencyUpdates.length) {
            message += `---\n`;
        }

        counter++;
    }

    return message;
}
