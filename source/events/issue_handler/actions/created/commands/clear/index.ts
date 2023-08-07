import Logger from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';
import { postCommentReaction } from '@adaptly/services/github/issues/comments/reactions/postCommentReaction';
import { getComments } from '@adaptly/services/github/issues/comments/getComments';
import { deleteComment } from '@adaptly/services/github/issues/comments/deleteComment';
import { deletePullRequest } from '@adaptly/database/operations/pull-request/delete';
import { ADAPTLY_BOT_NAME } from '@adaptly/consts';

export const clear = async (payload: IssueCommentEvent, octokit: Octokit) => {
    Logger.info('/adaptly clear invoked', { repository: payload.repository.full_name, PR: `#${payload.issue.number}` });

    const comments = await getComments(payload.repository.full_name, payload.issue.number, octokit);
    const adaptlyComments = comments.filter((comment) => comment.user.login === ADAPTLY_BOT_NAME);
    const adaptlyInvocationComments = comments.filter((comment) => comment.body.startsWith('/adaptly'));

    for (const comment of adaptlyComments) {
        await deleteComment(payload.repository.full_name, comment.id, octokit);
    }

    for (const comment of adaptlyInvocationComments) {
        await deleteComment(payload.repository.full_name, comment.id, octokit);
    }

    await deletePullRequest(payload.repository.id, payload.issue.number);
};
