import Logger from '@adaptly/logging/logger';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/core';
import { rimraf } from 'rimraf';
import path from 'path';
import { getPackagesDependenciesUpdated } from './source/pr-dependencies';
import { upsertDatabaseState } from './source/database-state/upsert';
import { getBreakingChangesReports } from './source/breaking-changes';
import { getRefactorsReports } from './source/refactors';
import { postBreakingChangesLoading } from './source/pr-comments/postBreakingChangesLoading';
import { postRefactorsLoading } from './source/pr-comments/postRefactorsLoading';
import { reportBreakingChangesReports, getBreakingChangesLoadingCommentId } from './source/breaking-changes/report';
import { getApprovalMessage } from './source/pr-comments/approvePR';
import { reportRefactorsReports } from './source/refactors/report';
import { postComment } from '@adaptly/services/github/issues/comments/postComment';
import { updateComment } from '@adaptly/services/github/issues/comments/updateComment';
import { clone, getCloneDestinationPath } from '@adaptly/services/git/clone';
import { checkout } from '@adaptly/services/git/checkout';
import { getPrInfo } from '@adaptly/services/github/pulls/getPrInfo';
import { DependencyUpdate } from './source/pr-dependencies/getDependenciesUpdated';

export const go = async (payload: IssueCommentEvent, installationId: number, octokit: Octokit) => {
    Logger.info('/adaptly go invoked', { repository: payload.repository.full_name, PR: `#${payload.issue.number}` });

    await postBreakingChangesLoading(payload, octokit);

    const updatedDependencies = await getPackagesDependenciesUpdated(payload.repository.full_name, payload.issue.number, octokit);
    if (!updatedDependencies.length || allVersionsChecked(updatedDependencies)) {
        await communicatePRLooksGood(payload, updatedDependencies, octokit);
        return;
    }

    // await setupRepositoryLocally(payload, installationId, octokit);

    const breakingChangesReports = await getBreakingChangesReports(updatedDependencies);

    Logger.info(`Prepared breaking changes reports`, {
        repository: payload.repository.full_name,
        PR: `#${payload.issue.number}`,
        breakingChangesReports
    });

    await reportBreakingChangesReports(breakingChangesReports, payload, octokit);

    // await postRefactorsLoading(payload, octokit);
    // const refactorsReports = await getRefactorsReports(breakingChangesReports, payload);
    // await reportRefactorsReports(refactorsReports, payload, octokit);

    await upsertDatabaseState(
        payload,
        breakingChangesReports.map((update) => update.dependencyUpdate)
    );

    // await upsertDatabaseState(
    //     payload,
    //     refactorsReports.map((refactor) => refactor.dependencyUpdate)
    // );

    // await deleteRepositoryLocally(payload);
};

function allVersionsChecked(updatedDependencies: DependencyUpdate[]): boolean {
    return updatedDependencies.every((dependency) => dependency.cursorVersion === dependency.targetVersion);
}

async function setupRepositoryLocally(payload: IssueCommentEvent, installationId: number, octokit: Octokit): Promise<void> {
    const repoName = payload.repository.full_name;

    const destinationPath = getCloneDestinationPath(repoName);
    await clone(repoName, installationId, destinationPath, octokit);

    const prInfo = await getPrInfo(payload.repository.full_name, payload.issue.number, octokit);
    await checkout(destinationPath, prInfo.head.sha);
}

export async function deleteRepositoryLocally(payload: IssueCommentEvent): Promise<void> {
    const repoName = payload.repository.full_name;

    const destinationPath = getCloneDestinationPath(repoName);

    // note(Lauris): we use path.dirname because REPO_NAME has x/y format
    await rimraf(path.dirname(destinationPath));
}

async function communicatePRLooksGood(payload: IssueCommentEvent, updatedDependencies: DependencyUpdate[], octokit: Octokit): Promise<void> {
    Logger.info('Responding that PR with no dependency updates looks good');

    const message = await getApprovalMessage(updatedDependencies);

    const loadingCommentId = await getBreakingChangesLoadingCommentId(payload, octokit);

    if (loadingCommentId) {
        await updateComment(payload.repository.full_name, loadingCommentId, message, octokit);
    } else {
        await postComment(payload.repository.full_name, payload.issue.number, message, octokit);
    }
}
