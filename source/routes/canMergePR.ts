import express from 'express';
import { Request, Response } from 'express';
import Logger from '@adaptly/logging/logger';

import { Octokit } from '@octokit/core';
import { getOctokitLight } from '@adaptly/services/github/auth/octokit';
import { getPackagesDependenciesUpdated } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies';
import { getBreakingChangesReports } from '@adaptly/events/issue_handler/actions/created/commands/go/source/breaking-changes';

const canMergePR = express.Router();

type RequestBody = {
    repoNameWithOwner: string;
    prNumber: number;
};

canMergePR.post('/can-merge-pr', async (req: Request, res: Response) => {
    try {
        const response = await processRequest(req, res);
        return response;
    } catch (error: any) {
        Logger.error('Error encountered', error);

        return res.status(422).json({
            message: 'Unprocessable entitiy'
        });
    }
});

async function processRequest(req: Request, res: Response): Promise<Response> {
    Logger.info('Can merge PR check: received request body', { body: req.body });

    const payload = req.body;

    if (!isRequestPayload(payload)) {
        return res.status(400).json({
            message: 'Invalid request payload'
        });
    }

    const repoNameWithOwner = payload.repoNameWithOwner;
    const prNumber = payload.prNumber;
    const octokit = await getOctokitLight();

    if (await canMerge(repoNameWithOwner, prNumber, octokit)) {
        return res.status(200).json({
            canMerge: true
        });
    }

    return res.status(200).json({
        canMerge: false
    });
}

function isRequestPayload(body: any): body is RequestBody {
    if (typeof body !== 'object') {
        return false;
    }

    return body.repoNameWithOwner && body.prNumber;
}

async function canMerge(repoNameWithOwner: string, prNumber: number, octokit: Octokit): Promise<boolean> {
    const updatedDependencies = await getPackagesDependenciesUpdated(repoNameWithOwner, prNumber, octokit);
    const breakingChangesReports = await getBreakingChangesReports(updatedDependencies);

    const reachedTargetVersion = breakingChangesReports.every(
        (report) => report.dependencyUpdate.cursorVersion === report.dependencyUpdate.targetVersion
    );

    const noBreakingChanges = breakingChangesReports.every((report) => report.breakingChanges.length === 0);

    return reachedTargetVersion && noBreakingChanges;
}

export { canMergePR };
