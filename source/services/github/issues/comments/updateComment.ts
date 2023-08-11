import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { Comment } from './postComment';

export async function updateComment(repoName: string, commentId: number, message: string, octokit: Octokit): Promise<Comment> {
    try {
        const { data: comment } = await octokit.request(`PATCH /repos/${repoName}/issues/comments/${commentId}`, {
            body: message
        });

        Logger.info(`Updated pull request comment`, { repository: repoName, updatedCommendId: commentId });
        return comment;
    } catch (error) {
        throwUpdatingCommentError(error, { repoName, commentId, message });
    }
}

const throwUpdatingCommentError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.updatingComment), error, context);

    throw new GithubError(ADAPTLY_ERRORS.updatingComment, context);
};
