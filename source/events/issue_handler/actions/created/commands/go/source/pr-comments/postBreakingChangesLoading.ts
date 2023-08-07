import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';

export const BREAKING_CHANGES_LOADING_MESSAGE = ':mag:&nbsp;&nbsp;finding breaking changes...';

export async function postBreakingChangesLoading(payload: IssueCommentEvent, octokit: Octokit): Promise<number> {
    const { id } = await postComment(payload.repository.full_name, payload.issue.number, BREAKING_CHANGES_LOADING_MESSAGE, octokit);

    return id;
}
