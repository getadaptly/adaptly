import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { BreakingChangesReport } from '.';
import { getProgressMessage, getReleaseUrl } from '../pr-comments/body';
import { BREAKING_CHANGES_LOADING_MESSAGE } from '../pr-comments/postBreakingChangesLoading';
import { BreakingChange } from './findBreakingChanges';
import { getComments } from '@adaptly/services/github/issues/comments/getComments';
import { Comment, postComment } from '@adaptly/services/github/issues/comments/postComment';
import { updateComment } from '@adaptly/services/github/issues/comments/updateComment';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export async function reportBreakingChangesReports(
    breakingChangesReports: BreakingChangesReport[],
    payload: IssueCommentEvent,
    octokit: Octokit
): Promise<void> {
    let counter = 1;

    if (breakingChangesReports.every((report) => report.breakingChanges.length === 0)) {
        const loadingCommentId = await getBreakingChangesLoadingCommentId(payload, octokit);
        const message = `:white_check_mark:&nbsp;&nbsp;All versions checked successfully! This PR looks good to me!\n\n`;

        if (loadingCommentId) {
            await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
        } else {
            await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
        }

        return;
    }

    for (const report of breakingChangesReports) {
        const message = await getBreakingChangesMessage(report.dependencyUpdate, report.breakingChanges);

        const loadingCommentId = await getBreakingChangesLoadingCommentId(payload, octokit);

        if (counter === 1 && loadingCommentId) {
            await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
        } else {
            await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
        }
    }
}

export async function getBreakingChangesLoadingCommentId(payload: IssueCommentEvent, octokit: Octokit): Promise<number | undefined> {
    const comments = await getComments(payload.repository.full_name, payload.issue.number, octokit);

    const loadingComment = comments.reverse().find((comment: Comment) => comment.body === BREAKING_CHANGES_LOADING_MESSAGE);

    return loadingComment?.id;
}

export async function getBreakingChangesMessage(dependencyUpdate: DependencyUpdate, breakingChanges: BreakingChange[]): Promise<string> {
    let message = '';
    if (breakingChanges.length) {
        const releaseUrl = await getReleaseUrl(dependencyUpdate.dependencyRepoUrl, dependencyUpdate.cursorVersion);

        if (dependencyUpdate.dependencyName.startsWith('@types/')) {
            return `:see_no_evil:&nbsp;&nbsp;${dependencyUpdate.dependencyName}: Adaptly ignores Type updates.Types have no clear source of change logs so Adaptly does not check Type updates.\n\nPackage: [${dependencyUpdate.dependencyName}](${dependencyUpdate.dependencyUrl})\nVersion: [${dependencyUpdate.cursorVersion}](${releaseUrl})\n`;
        }

        message = `### :warning:&nbsp;&nbsp;${dependencyUpdate.dependencyName}@${dependencyUpdate.cursorVersion}`;

        let breakingChangeNumber = 1;

        message += '\n<details>\n<summary>&nbsp;Breaking changes</summary>\n\n';

        for (let breakingChange of breakingChanges) {
            message += `\n\n<details>\n<summary>${breakingChangeNumber}: ${replaceBackticksWithHTML(breakingChange.title)}</summary>\n\n`;
            message += `> ${breakingChange.description}`;
            message += `\n</details>\n`;
            breakingChangeNumber++;
        }

        message += '\n\n</details>\n';
    } else {
        message = `### :white_check_mark:&nbsp;&nbsp;${dependencyUpdate.dependencyName}\nNo breaking changes found.\n\n`;
    }
    // message += getProgressMessage(dependencyUpdate);

    return message;
}

function replaceBackticksWithHTML(str: string): string {
    return str.replace(/`([^`]*)`/g, '<code>$1</code>');
}
