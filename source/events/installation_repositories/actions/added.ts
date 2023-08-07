import Logger from '@adaptly/logging/logger';
import { InstallationRepositoriesEvent } from '@octokit/webhooks-types';
import { createRepository } from '@adaptly/database/operations/repository/create';

export const added = async (payload: InstallationRepositoriesEvent) => {
    Logger.info(`Adaptly has been installed on new repositories`, { repositories: payload.repositories_added });

    for (const repo of payload.repositories_added) {
        const repoName = repo.full_name;
        await createRepository(repoName);
    }
};
