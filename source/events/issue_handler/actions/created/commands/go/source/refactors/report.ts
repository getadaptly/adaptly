import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { RefactorsReport } from '.';
import { BreakingChange } from '../breaking-changes/findBreakingChanges';
import { getProgressMessage, getReleaseUrl } from '../pr-comments/body';
import { REFACTORS_LOADING_MESSAGE } from '../pr-comments/postRefactorsLoading';
import { Refactor } from './findRefactors';
import Logger from '@adaptly/logging/logger';
import { getComments } from '@adaptly/services/github/issues/comments/getComments';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { updateComment } from '@adaptly/services/github/issues/comments/updateComment';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export async function reportRefactorsReports(reports: RefactorsReport[], payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    Logger.info('Reporting refactors', { repository: payload.repository.full_name, PR: `#${payload.issue.number}` });

    let dependencyUpdateNumber = 1;

    for (const report of reports) {
        await reportRefactors(report.dependencyUpdate, report.refactors, dependencyUpdateNumber, payload, octokit);
        dependencyUpdateNumber++;
    }
}

async function reportRefactors(
    dependencyUpdate: DependencyUpdate,
    refactors: Refactor[],
    dependencyUpdateNumber: number,
    payload: IssueCommentEvent,
    octokit: Octokit
): Promise<void> {
    let counter = 1;

    const loadingCommentId = await getRefactorsLoadingCommentId(payload, octokit);

    for (let refactor of refactors) {
        let message = await getRefactorMessage(
            dependencyUpdate.dependencyName,
            dependencyUpdate.cursorVersion,
            dependencyUpdate.dependencyRepoUrl,
            dependencyUpdate.dependencyUrl,
            refactor.breakingChange,
            refactor.filesAtRisk,
            payload.repository.html_url,
            payload.repository.default_branch
        );

        const progress = getProgressMessage(dependencyUpdate);

        message += `${progress}`;

        if (dependencyUpdateNumber === 1 && counter === 1 && loadingCommentId) {
            await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
        } else {
            await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
        }

        counter++;
    }
}

export async function getRefactorsLoadingCommentId(payload: IssueCommentEvent, octokit: Octokit): Promise<number | undefined> {
    const comments = await getComments(payload.repository.full_name, payload.issue.number, octokit);

    const loadingComment = comments.reverse().find((comment) => comment.body === REFACTORS_LOADING_MESSAGE);

    return loadingComment?.id;
}

async function getRefactorMessage(
    dependencyName: string,
    cursorVersion: string,
    dependecyRepoUrl: string,
    dependencyUrl: string,
    breakingChange: BreakingChange,
    filesAtRisk: string[],
    repoUrl: string,
    repoDefaultBranch: string
): Promise<string> {
    const releaseUrl = await getReleaseUrl(dependecyRepoUrl, cursorVersion);

    let message = `:construction:&nbsp;&nbsp;Refactor needed\n\nPackage: [${dependencyName}](${dependencyUrl})\nVersion: [${cursorVersion}](${releaseUrl})\n\nBreaking change: ${breakingChange.title}\n`;

    message += '\n<details>\n<summary>Check details</summary>\n\n';
    message += breakingChange.description;
    message += '\n</details>\n';

    message += '\n<details>\n<summary>Files at risk</summary>\n\n';

    for (const file of filesAtRisk) {
        message += `- [ ] [${file}](${repoUrl}/blob/${repoDefaultBranch}/${file})\n`;
    }

    message += '</details>\n';

    return message;
}
