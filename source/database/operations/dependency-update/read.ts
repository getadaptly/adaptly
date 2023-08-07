import { prisma } from '@adaptly/database/prisma';
import { throwRepositoryNotFound } from '@adaptly/errors/shared';
import { DependencyUpdate } from '@prisma/client';

export async function retrieveDependencyUpdate(
    dependencyName: string,
    prNumber: number,
    repositoryFullName: string
): Promise<DependencyUpdate | undefined> {
    const repository = await prisma.repository.findUnique({
        where: {
            fullName: repositoryFullName
        },
        include: {
            pullRequests: {
                where: {
                    number: prNumber
                },
                include: {
                    dependencyUpdates: {
                        where: {
                            dependencyName
                        }
                    }
                }
            }
        }
    });

    // note(Lauris): We can do following because PullRequest has @@unique([repositoryId, number])
    const pullRequest = repository?.pullRequests[0];
    // note(Lauris): We can do following because DependencyUpgrade has @@unique([repositoryId, pullRequestId, dependencyName])
    return pullRequest?.dependencyUpdates[0];
}
