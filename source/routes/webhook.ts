import express from 'express';
import { Request, Response } from 'express';
import Logger from '@adaptly/logging/logger';

import { ISSUE_EVENT, issueHandler } from '@adaptly/events/issue_handler';
import { INSTALLATION_REPOSITORIES_EVENT, installationRepositoriesHandler } from '@adaptly/events/installation_repositories';
import { INSTALLATION_EVENT, installationHandler } from '@adaptly/events/installation';

const webhook = express.Router();

webhook.post('/webhook', async (req: Request, res: Response) => {
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
    const eventType = getGitHubEventType(req);

    Logger.info(`Webhook received request with event type "${eventType}"`);

    switch (eventType) {
        case INSTALLATION_EVENT:
            await installationHandler(req);
            break;
        case INSTALLATION_REPOSITORIES_EVENT:
            await installationRepositoriesHandler(req);
            break;
        case ISSUE_EVENT:
            await issueHandler(req);
            break;
        default: {
            Logger.info('Webook ignored unsupported event type', { eventType });
            return res.status(204).json({
                message: 'Ignored'
            });
        }
    }

    return res.status(200).json({
        message: 'OK'
    });
}

function getGitHubEventType(req: Request): string {
    const eventType = req.headers['x-github-event'] as string;

    return eventType;
}

export { webhook };
