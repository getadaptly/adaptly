import Logger from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';

import { storeInDatabase } from '@adaptly/database/operations/user-feedback/create';
import { postCommentReaction } from '@adaptly/services/github/issues/comments/reactions/postCommentReaction';

export const feedback = async (payload: IssueCommentEvent, octokit: Octokit) => {
    Logger.info('/adaptly feedback invoked', { repository: payload.repository.full_name, PR: `#${payload.issue.number}` });

    await postCommentReaction(payload.repository.full_name, payload.comment.id, 'heart', octokit);

    const feedback = extractFeedback(payload.comment.body);

    await storeInDatabase(payload.repository.full_name, feedback);
};

function extractFeedback(comment: string): string {
    const commandStart = comment.indexOf('feedback');

    if (commandStart === -1) {
        return '';
    }

    const contentStart = commandStart + 'feedback'.length;

    return comment.substring(contentStart).trim();
}
