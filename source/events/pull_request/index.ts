import { PullRequestEvent } from '@octokit/webhooks-types';
import { Request } from 'express';
import { throwRequestMissingInformation } from '@adaptly/errors/shared';
import { opened } from './actions/opened';

export const PULL_REQUEST_EVENT = 'pull_request';

export const pullRequestHandler = async (req: Request) => {
    const payload = getPayload(req);

    switch (payload.action) {
        case 'opened': {
            await opened(payload);
            break;
        }
        default:
            break;
    }
};

function getPayload(req: Request): PullRequestEvent {
    const payload = req.body;

    try {
        if (!payload) {
            throw new Error('Payload is missing');
        }

        const eventType = req.headers['x-github-event'] as string;

        if (eventType !== PULL_REQUEST_EVENT) {
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
