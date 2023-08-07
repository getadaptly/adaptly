import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';

export const REFACTORS_LOADING_MESSAGE = ':mag:&nbsp;&nbsp;finding refactors...';

export async function postRefactorsLoading(payload: IssueCommentEvent, octokit: Octokit): Promise<number> {
    const { id } = await postComment(payload.repository.full_name, payload.issue.number, REFACTORS_LOADING_MESSAGE, octokit);

    return id;
}
