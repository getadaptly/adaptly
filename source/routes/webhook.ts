import express from 'express';
import { Request, Response } from 'express';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { getOctokit } from '@adaptly/services/github/auth/octokit';

import { InstallationCreatedEvent, InstallationEvent, InstallationRepositoriesEvent, IssueCommentEvent } from '@octokit/webhooks-types';
import { issueHandler } from '@adaptly/events/issue_handler';
import { installationRepositoriesHandler } from '@adaptly/events/installation_repositories';
import { AdaptlyError, ErrorHandler } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { installationHandler } from '@adaptly/events/installation';

const webhook = express.Router();

type AdaptlyEvent = IssueCommentEvent | InstallationRepositoriesEvent | InstallationCreatedEvent;

type GitHubRequest = {
    payload: AdaptlyEvent;
    eventType: string;
    action: string;
    repoName: string;
};

webhook.post('/webhook', async (req: Request, res: Response) => {
    Logger.info(`Webhook received request`);

    let payload: AdaptlyEvent | undefined = undefined;
    let eventType: string | undefined = undefined;
    let action: string | undefined = undefined;
    let repoName: string | undefined = undefined;

    try {
        const gitHubEvent = getGitHubEvent(req);

        payload = gitHubEvent.payload;
        eventType = gitHubEvent.eventType;
        action = gitHubEvent.action;
        repoName = gitHubEvent.repoName;
    } catch (error: any) {
        Logger.error(`Unable to extract information from payload`, error);
        return res.status(422).json({
            message: 'Unprocessable entitiy'
        });
    }

    if (eventType !== 'installation' && eventType !== 'installation_repositories' && eventType !== 'issue_comment') {
        Logger.info('Webook received unsupported event type', { eventType });

        return res.status(204).json({
            message: 'Ignored'
        });
    }

    Logger.info('Webhook extracted request information', { repository: repoName, eventType, action });

    const { octokit, installationId } = await getOctokit(repoName);

    if (eventType === 'installation') {
        await installationHandler(payload as InstallationCreatedEvent);
        return res.status(200).json({
            message: 'OK'
        });
    }

    if (eventType === 'installation_repositories') {
        await installationRepositoriesHandler(payload as InstallationRepositoriesEvent);
        return res.status(200).json({
            message: 'OK'
        });
    }

    if (eventType === 'issue_comment') {
        await issueHandler(payload as IssueCommentEvent, installationId, octokit);
        return res.status(200).json({
            message: 'OK'
        });
    }
});

function getGitHubEvent(req: Request): GitHubRequest {
    const payload = req.body as AdaptlyEvent;
    const eventType = req.headers['x-github-event'] as string;
    const action = payload.action;
    let repoName;

    if (!payload) {
        throwPayloadMissingInformation(new Error('Payload is missing'));
    }

    if (!eventType) {
        throwPayloadMissingInformation(new Error('Event type is missing'));
    }

    if (!action) {
        throwPayloadMissingInformation(new Error('Action is missing'));
    }

    switch (eventType) {
        case 'installation':
            const newOrgPayload = payload as InstallationCreatedEvent;
            if (newOrgPayload.repositories && newOrgPayload.repositories.length > 0) {
                repoName = newOrgPayload.repositories[0].full_name;
            }
            break;
        case 'installation_repositories':
            const installRepoPayload = payload as InstallationRepositoriesEvent;
            if (installRepoPayload.repositories_added && installRepoPayload.repositories_added.length > 0) {
                repoName = installRepoPayload.repositories_added[0].full_name;
            }
            break;
        case 'issue_comment':
            const issueCommentPayload = payload as IssueCommentEvent;
            repoName = issueCommentPayload.repository.full_name;
            break;
        default:
            throwPayloadMissingInformation(new Error(`Unhandled event type: ${eventType}`));
    }

    if (!repoName) {
        throwPayloadMissingInformation(new Error('Repo name is missing'));
    }

    return {
        payload,
        eventType,
        action,
        repoName
    };
}

const throwPayloadMissingInformation: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.payloadMissingInformation), error, context);

    throw new AdaptlyError(ADAPTLY_ERRORS.payloadMissingInformation, context);
};

export { webhook };
