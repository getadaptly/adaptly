import { IssueCommentEvent } from '@octokit/webhooks-types';
import { PullRequest, DependencyUpdate as DependencyUpdatePrisma } from '@prisma/client';
import { findRepository } from '@adaptly/database/operations/repository/read';
import { createPullRequest } from '@adaptly/database/operations/pull-request/create';
import Logger from '@adaptly/logging/logger';
import { upsertDependencyUpdate } from '@adaptly/database/operations/dependency-update/upsert';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

export type DatabaseState = {
    dependencyUpdates: DependencyUpdatePrisma[];
    pullRequest: PullRequest;
};

async function upsertDatabaseState(payload: IssueCommentEvent, updates: DependencyUpdate[]): Promise<DatabaseState> {
    const repository = await findRepository(payload.repository.full_name);
    const pullRequest = await createPullRequest(payload, repository.id);

    const dependencyUpdates: DependencyUpdatePrisma[] = [];

    for (let update of updates) {
        const dependencyUpdate = await upsertDependencyUpdate(update, repository.id, pullRequest.id);
        dependencyUpdates.push(dependencyUpdate);
    }

    Logger.info('Upserted dependency updates', { dependencyUpdates, pullRequest });

    return {
        pullRequest,
        dependencyUpdates
    };
}

export { upsertDatabaseState };
