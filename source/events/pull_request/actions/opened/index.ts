import Logger from '@adaptly/logging/logger';
import { PullRequestOpenedEvent } from '@octokit/webhooks-types';
import { getOctokit } from '@adaptly/services/github/auth/octokit';
import { getPackagesDependenciesUpdated } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies';
import { reportBreakingChanges } from '@adaptly/events/issue_handler/actions/created/commands/go/source/breaking-changes/reportBreakingChanges';
import { DEPENDABOT_BOT_LOGIN, RENOVATE_BOT_LOGIN } from '@adaptly/consts';

export const opened = async (payload: PullRequestOpenedEvent) => {
    const repoName = payload.repository.full_name;
    const prNumber = payload.pull_request.id;
    const author = payload.sender.login;

    if (author !== RENOVATE_BOT_LOGIN && author !== DEPENDABOT_BOT_LOGIN) {
        Logger.info(`Adaptly will ignore PR`, { repository: repoName, pr: `$${prNumber}` });
        return;
    }

    Logger.info(`Adaptly will process a new bot PR`, { repository: repoName, pr: `$${prNumber}` });

    const { octokit } = await getOctokit(repoName);

    const updatedDependencies = await getPackagesDependenciesUpdated(repoName, prNumber, octokit);
    for (let dependency of updatedDependencies) {
        await reportBreakingChanges(repoName, prNumber, dependency, octokit);
    }
};
