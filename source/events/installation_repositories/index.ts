import { throwRequestMissingInformation } from '@adaptly/errors/shared';
import { added } from '@adaptly/events/installation_repositories/actions/added';
import { InstallationRepositoriesEvent } from '@octokit/webhooks-types';
import { Request } from 'express';

export const INSTALLATION_REPOSITORIES_EVENT = 'installation_repositories';

export const installationRepositoriesHandler = async (req: Request) => {
    const payload = getPayload(req);

    switch (payload.action) {
        case 'added':
            await added(payload);
            break;
        default:
            break;
    }
};

function getPayload(req: Request): InstallationRepositoriesEvent {
    const payload = req.body;

    try {
        if (!payload) {
            throw new Error('Payload is missing');
        }

        const eventType = req.headers['x-github-event'] as string;

        if (eventType !== INSTALLATION_REPOSITORIES_EVENT) {
            throw new Error('Event type invalid');
        }
    } catch (error) {
        throwRequestMissingInformation(error);
    }

    return payload;
}
