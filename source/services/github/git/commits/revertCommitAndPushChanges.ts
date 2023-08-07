import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, GithubError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { updateBranchReference } from '../refs/heads/updateBranchReference';
import { getCommitHistory } from './getCommitHistory';
import { postComment } from '../../issues/comments/postComment';

export async function revertCommitAndPushChanges(
    pullRequestUrl: string,
    repoName: string,
    pullRequestNumber: number,
    branchName: string,
    botName: string,
    octokit: Octokit
): Promise<void> {
    try {
        const commitHistory = await getCommitHistory(repoName, branchName, octokit);
        const lastCommit = commitHistory[0];
        const lastCommitAuthor = lastCommit.commit.author.name;

        if (lastCommitAuthor === botName) {
            const previousCommitSha = lastCommit.parents[0].sha;

            Logger.info(`Updating the branch reference to the previous commit`);
            await updateBranchReference(repoName, branchName, previousCommitSha, true, octokit); // Pass 'true' to force-push

            const message = `We have reverted the commit made by **${botName}** and returned to commit ${previousCommitSha}. 
        We apologize for any inconvenience. If you have any feedback, please feel free to contact us at support@adaptly.dev.`;
            Logger.info(`Posting comment about the revert to ${pullRequestUrl}`);
            await postComment(repoName, pullRequestNumber, message, octokit);
        } else {
            Logger.warn(`The last commit is not by ${botName} for ${pullRequestUrl}. Skipping revert.`);
        }
    } catch (error) {
        throwRevertingCommitError(error, { pullRequestUrl, repoName, pullRequestNumber, branchName, botName });
    }
}

const throwRevertingCommitError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.revertingCommit), error, context);

    throw new GithubError(ADAPTLY_ERRORS.revertingCommit, context);
};
