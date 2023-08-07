import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { Comment } from './postComment';

export async function getComments(repoName: string, pullRequestNumber: number, octokit: Octokit): Promise<Comment[]> {
    try {
        const comments: Comment[] = [];

        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const { data } = await octokit.request(`GET /repos/${repoName}/issues/${pullRequestNumber}/comments?per_page=100&page=${page}`);

            if (data.length === 0) {
                hasNextPage = false;
            }

            page++;

            comments.push(...data);
        }

        Logger.info('Fetched PR comments', { repository: repoName, PR: `#${pullRequestNumber}`, commentsCount: comments.length });

        return comments;
    } catch (error) {
        throwRetrievingCommentsError(error, { repoName, pullRequestNumber });
    }
}

const throwRetrievingCommentsError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.retrievingComments), error, context);

    throw new GithubError(ADAPTLY_ERRORS.retrievingComments, context);
};
