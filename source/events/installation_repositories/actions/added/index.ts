import Logger from '@adaptly/logging/logger';
import { InstallationRepositoriesEvent } from '@octokit/webhooks-types';
import { getOctokit } from '@adaptly/services/github/auth/octokit';
import { getRepositoryOwnerAndName } from '@adaptly/services/github/utils/repository';
import { getRepositoryBotPRs } from './source/graphql/query-repository';
import { getPackagesDependenciesUpdated } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies';
import { reportBreakingChanges } from '@adaptly/events/issue_handler/actions/created/commands/go/source/breaking-changes/reportBreakingChanges';

export const added = async (payload: InstallationRepositoriesEvent) => {
    Logger.info(`Adaptly has been installed on new repositories`, { repositories: payload.repositories_added.map((repo) => repo.full_name) });

    for (const repo of payload.repositories_added) {
        const { octokit } = await getOctokit(repo.full_name);
        const [owner, name] = getRepositoryOwnerAndName(repo.full_name);

        const prs = await getRepositoryBotPRs(owner, name);

        for (let pr of prs) {
            const updatedDependencies = await getPackagesDependenciesUpdated(repo.full_name, pr.number, octokit);
            for (let dependency of updatedDependencies) {
                await reportBreakingChanges(repo.full_name, pr.number, dependency, octokit);
            }
        }
    }
};
