import { prisma } from '@adaptly/database/prisma';
import { PullRequest } from '@prisma/client';

export async function updatePullRequest(repositoryId: number, pullRequestNumber: number, update: Partial<PullRequest>): Promise<PullRequest> {
    const updated = await prisma.pullRequest.update({
        where: {
            repositoryId_number: {
                repositoryId,
                number: pullRequestNumber
            }
        },
        data: {
            ...update
        }
    });

    return updated;
}
