import Logger from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

type ReviewCommentType = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

export async function postReviewComment(
    repoName: string,
    pullRequestNumber: number,
    message: string,
    messageType: ReviewCommentType,
    octokit: Octokit
) {
    const { data: comment } = await octokit.request(`POST /repos/${repoName}/pulls/${pullRequestNumber}/reviews`, {
        body: message,
        event: messageType,
        comments: []
    });

    Logger.info(`Posted review comment on (comment ID: ${comment.id})`);
}
