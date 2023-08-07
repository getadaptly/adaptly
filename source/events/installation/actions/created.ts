import Logger from '@adaptly/logging/logger';
import { InstallationCreatedEvent } from '@octokit/webhooks-types';
import { createRepository } from '@adaptly/database/operations/repository/create';

export const created = async (payload: InstallationCreatedEvent) => {
    Logger.info(`Adaptly has been installed on new organization in the following repos`, {
        org: payload.installation.account.login,
        repositories: payload.repositories
    });

    if (!payload.repositories) {
        Logger.warn(`Adaptly was not installed on any repositories in org`, { org: payload.installation.account.login });
        return;
    }

    for (const repo of payload.repositories) {
        const repoName = repo.full_name;
        await createRepository(repoName);
    }
};
