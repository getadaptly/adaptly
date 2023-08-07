import { prisma } from '@adaptly/database/prisma';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { PullRequest } from '@prisma/client';

export async function createPullRequest(payload: IssueCommentEvent, repositoryId: number): Promise<PullRequest> {
    const number = payload.issue.number;

    const existing = await prisma.pullRequest.findFirst({
        where: {
            number,
            repositoryId
        }
    });

    if (existing) {
        return existing;
    }

    const pullRequest = await prisma.pullRequest.create({
        data: {
            number,
            repositoryId: repositoryId
        }
    });

    return pullRequest;
}
