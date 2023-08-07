import { Octokit } from '@octokit/core';
import { created } from '@adaptly/events/issue_handler/actions/created';
import { IssueCommentEvent } from '@octokit/webhooks-types';

export const issueHandler = async (payload: IssueCommentEvent, installationId: number, octokit: Octokit) => {
    switch (payload.action) {
        case 'created':
            await created(payload, installationId, octokit);
            break;
        default:
            break;
    }
};
