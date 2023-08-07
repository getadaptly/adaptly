import { created } from '@adaptly/events/installation/actions/created';
import { InstallationCreatedEvent } from '@octokit/webhooks-types';

export const installationHandler = async (payload: InstallationCreatedEvent) => {
    switch (payload.action) {
        case 'created':
            await created(payload);
            break;
        default:
            break;
    }
};
