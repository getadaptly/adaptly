import Logger from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';

export const help = async (payload: IssueCommentEvent, octokit: Octokit) => {
    Logger.info('/adaptly help invoked', { repository: payload.repository.full_name, PR: `#${payload.issue.number}` });

    const message = `:computer:&nbsp;&nbsp;Adaptly commands.\n\n\`go\` : invoke Adaptly.\n\n\`clear\`: clear comments and return to pre-start state.\n\n\`help\` : show available commands.
`;

    await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
};
