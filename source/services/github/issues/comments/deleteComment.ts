import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export async function deleteComment(repoName: string, commentId: number, octokit: Octokit): Promise<void> {
    try {
        const { data } = await octokit.request(`DELETE /repos/${repoName}/issues/comments/${commentId}`);

        Logger.info(`Deleted pull request comment`, { repository: repoName, deletedCommendId: commentId, response: data });
    } catch (error) {
        throwDeletingCommentError(error, { repoName, commentId });
    }
}

const throwDeletingCommentError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.deletingComment), error, context);

    throw new GithubError(ADAPTLY_ERRORS.deletingComment, context);
};
