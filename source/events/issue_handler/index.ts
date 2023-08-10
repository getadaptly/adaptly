import { created } from '@adaptly/events/issue_handler/actions/created';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Request } from 'express';
import { getOctokit } from '@adaptly/services/github/auth/octokit';
import { throwRequestMissingInformation } from '@adaptly/errors/shared';

export const ISSUE_EVENT = 'issue_comment';

export const issueHandler = async (req: Request) => {
    const payload = getPayload(req);
    const repoName = payload.repository.full_name;

    switch (payload.action) {
        case 'created': {
            const { octokit, installationId } = await getOctokit(repoName);
            await created(payload, installationId, octokit);
            break;
        }
        default:
            break;
    }
};

function getPayload(req: Request): IssueCommentEvent {
    const payload = req.body;

    try {
        if (!payload) {
            throw new Error('Payload is missing');
        }

        const eventType = req.headers['x-github-event'] as string;

        if (eventType !== ISSUE_EVENT) {
            throw new Error('Event type invalid');
        }

        if (!payload.repository.full_name) {
            throw new Error('Repository name is missing');
        }
    } catch (error) {
        throwRequestMissingInformation(error);
    }

    return payload;
}
