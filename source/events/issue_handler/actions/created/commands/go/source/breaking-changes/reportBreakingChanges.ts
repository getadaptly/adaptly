import { getChangelog } from '@adaptly/services/adaptly/changelogHunter';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { DependencyUpdate } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies/getDependenciesUpdated';
import { Octokit } from '@octokit/core';
import { getBreakingChangesMessage } from './report';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { extractBreakingChanges, moveCursorVersion } from './findBreakingChanges';

export async function reportBreakingChanges(
    repoFullName: string,
    prNumber: number,
    dependencyUpdate: DependencyUpdate,
    octokit: Octokit
): Promise<void> {
    let cursorVersion: string | undefined = moveCursorVersion(dependencyUpdate);
    let breakingChangesEncountered = false;

    if (dependencyUpdate.dependencyName.startsWith('@types/')) {
        const message = await getBreakingChangesMessage({ ...dependencyUpdate }, [
            {
                title: `${dependencyUpdate.dependencyName}: Adaptly ignores Type updates`,
                description: 'Types have no clear source of change logs so Adaptly does not check Type updates'
            }
        ]);

        await postComment(repoFullName, prNumber, message, octokit);
        return;
    }

    while (cursorVersion) {
        const breakingChanges = await extractBreakingChanges(
            dependencyUpdate.dependencyName,
            cursorVersion,
            dependencyUpdate.dependencyRepoUrl,
            octokit
        );

        if (breakingChanges.length) {
            breakingChangesEncountered = true;
            const message = await getBreakingChangesMessage({ ...dependencyUpdate, cursorVersion }, breakingChanges);
            await postComment(repoFullName, prNumber, message, octokit);
        }

        cursorVersion = moveCursorVersion(dependencyUpdate);
    }

    if (!breakingChangesEncountered) {
        const message = await getBreakingChangesMessage({ ...dependencyUpdate, cursorVersion: dependencyUpdate.targetVersion }, []);
        await postComment(repoFullName, prNumber, message, octokit);
    }
}
