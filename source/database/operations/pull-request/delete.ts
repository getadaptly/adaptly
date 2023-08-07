import { prisma } from '@adaptly/database/prisma';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { PullRequest } from '@prisma/client';

export async function deletePullRequest(repositoryId: number, prNumber: number): Promise<void> {
    await prisma.pullRequest.deleteMany({
        where: {
            number: prNumber,
            repositoryId
        }
    });
}
