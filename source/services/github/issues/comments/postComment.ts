import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

export type Comment = {
    id: number;
    user: {
        login: string;
    };
    body: string;
};

export async function postComment(repoName: string, pullRequestNumber: number, message: string, octokit: Octokit): Promise<Comment> {
    try {
        const { data: comment } = await octokit.request(`POST /repos/${repoName}/issues/${pullRequestNumber}/comments`, {
            body: message
        });

        Logger.info('Posted pull request comment', { repository: repoName, PR: `#${pullRequestNumber}` });
        return comment;
    } catch (error) {
        throwPostingCommentError(error, { repoName, pullRequestNumber, message });
    }
}

const throwPostingCommentError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.postingComment), error, context);

    throw new GithubError(ADAPTLY_ERRORS.postingComment, context);
};
