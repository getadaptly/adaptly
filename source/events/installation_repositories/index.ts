import { added } from '@adaptly/events/installation_repositories/actions/added';
import { InstallationRepositoriesEvent } from '@octokit/webhooks-types';

export const installationRepositoriesHandler = async (payload: InstallationRepositoriesEvent) => {
    switch (payload.action) {
        case 'added':
            await added(payload);
            break;
        default:
            break;
    }
};
