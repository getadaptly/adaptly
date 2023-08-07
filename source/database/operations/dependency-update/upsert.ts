import { prisma } from '@adaptly/database/prisma';
import { DependencyUpdate } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies/getDependenciesUpdated';
import { DependencyUpdate as DependencyUpdatePrisma } from '@prisma/client';

export async function upsertDependencyUpdate(update: DependencyUpdate, repositoryId: number, pullRequestId: number): Promise<DependencyUpdatePrisma> {
    const dependencyName = update.dependencyName;

    const dependencyUpdate = await prisma.dependencyUpdate.upsert({
        where: {
            repositoryId_pullRequestId_dependencyName: {
                repositoryId,
                pullRequestId,
                dependencyName
            }
        },
        update: { repositoryId, pullRequestId, ...update },
        create: { repositoryId, pullRequestId, ...update }
    });

    return dependencyUpdate;
}
