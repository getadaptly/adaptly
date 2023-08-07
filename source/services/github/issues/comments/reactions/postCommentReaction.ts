import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';

type Reaction = '-1' | '+1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes';

export async function postCommentReaction(repoName: string, commentId: number, reaction: Reaction, octokit: Octokit): Promise<void> {
    try {
        const { data } = await octokit.request(`POST /repos/${repoName}/issues/comments/${commentId}/reactions`, {
            content: reaction
        });

        Logger.info(`Posted comment reaction`, { repository: repoName, commentId, reaction, response: data });
    } catch (error) {
        throwPostingCommentReactionError(error, { repoName, commentId, reaction });
    }
}

const throwPostingCommentReactionError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.postingCommentReaction), error, context);

    throw new GithubError(ADAPTLY_ERRORS.postingCommentReaction, context);
};
