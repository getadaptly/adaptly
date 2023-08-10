import { throwRequestMissingInformation } from '@adaptly/errors/shared';
import { created } from '@adaptly/events/installation/actions/created';
import { InstallationEvent } from '@octokit/webhooks-types';
import { Request } from 'express';

export const INSTALLATION_EVENT = 'installation';

export const installationHandler = async (req: Request) => {
    const payload = getPayload(req);

    switch (payload.action) {
        case 'created':
            await created(payload);
            break;
        default:
            break;
    }
};

function getPayload(req: Request): InstallationEvent {
    const payload = req.body;

    try {
        if (!payload) {
            throw new Error('Payload is missing');
        }

        const eventType = req.headers['x-github-event'] as string;

        if (eventType !== INSTALLATION_EVENT) {
            throw new Error('Event type invalid');
        }
    } catch (error) {
        throwRequestMissingInformation(error);
    }

    return payload;
}
