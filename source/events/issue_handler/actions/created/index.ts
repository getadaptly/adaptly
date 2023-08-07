import Logger, { getMessage } from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';
import { deleteRepositoryLocally, go } from './commands/go';
import { help } from './commands/help';
import { clear } from './commands/clear';
import { feedback } from './commands/feedback';
import { AdaptlyError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS, userErrorPrefix } from '@adaptly/errors';
import { BREAKING_CHANGES_LOADING_MESSAGE } from './commands/go/source/pr-comments/postBreakingChangesLoading';
import { REFACTORS_LOADING_MESSAGE } from './commands/go/source/pr-comments/postRefactorsLoading';
import { deleteComment } from '@adaptly/services/github/issues/comments/deleteComment';
import { getComments } from '@adaptly/services/github/issues/comments/getComments';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';

import { captureException } from '@sentry/node';
import { findRepository } from '@adaptly/database/operations/repository/read';

export const ADAPTLY_USER_LOGIN = 'adaptly-bot[bot]';

export const created = async (payload: IssueCommentEvent, installationId: number, octokit: Octokit) => {
    if (shouldIgnore(payload)) {
        Logger.info('Ignoring PR comment', { comment: payload.comment, sender: payload.sender });
        return;
    }

    const command = getCommand(payload);

    try {
        await findRepository(payload.repository.full_name);
        await runCommand(command, payload, installationId, octokit);
    } catch (error) {
        await deleteRepositoryLocally(payload);
        await handleError(error, payload, octokit);
    }
};

function shouldIgnore(payload: IssueCommentEvent): boolean {
    const notAdaptlyCommand = !payload.comment.body.startsWith('/adaptly');
    const isAdaptlyComment = payload.sender.login === ADAPTLY_USER_LOGIN;

    return notAdaptlyCommand || isAdaptlyComment;
}

function getCommand(payload: IssueCommentEvent): string {
    const command = payload.comment.body.split(' ')[1];
    return command;
}

async function runCommand(command: string, payload: IssueCommentEvent, installationId: number, octokit: Octokit): Promise<void> {
    switch (command) {
        case 'go':
            await go(payload, installationId, octokit);
            break;
        case 'clear':
            await clear(payload, octokit);
            break;
        case 'feedback':
            await feedback(payload, octokit);
            break;
        case 'help':
            await help(payload, octokit);
            break;
        default:
            communicateInvalidCommand(command, payload, octokit);
    }
}

async function communicateInvalidCommand(command: string, payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    const message = `Invalid command "${command}". Use "/adaptly help" to see available commands.`;

    await postComment(payload.repository.full_name, payload.issue.number, message, octokit);

    Logger.info(`Unknown Adaptly command`, { command });
}

async function handleError(error: any, payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    captureException(error);

    if (error instanceof AdaptlyError) {
        const comment = `:sob: Error\n\n${userErrorPrefix} ${error.value.code}`;

        await cleanUpLoadingComments(payload, octokit);

        await postComment(payload.repository.full_name, payload.issue.number, comment, octokit);
    } else {
        Logger.error(getMessage(ADAPTLY_ERRORS.unknownError), error);
    }
}

async function cleanUpLoadingComments(payload: IssueCommentEvent, octokit: Octokit): Promise<void> {
    const comments = await getComments(payload.repository.full_name, payload.issue.number, octokit);

    for (let comment of comments) {
        if (comment.body === BREAKING_CHANGES_LOADING_MESSAGE || comment.body === REFACTORS_LOADING_MESSAGE) {
            await deleteComment(payload.repository.full_name, comment.id, octokit);
        }
    }
}
