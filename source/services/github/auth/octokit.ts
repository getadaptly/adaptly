import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';
import jwt from 'jsonwebtoken';
import axios from 'axios';

import { getEnv } from '@adaptly/env';

import Logger, { getMessage } from '@adaptly/logging/logger';
import { GITHUB_API_URL } from '@adaptly/consts';
import { ErrorHandler, OctokitError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';

export async function getOctokit(repoName: string): Promise<{ octokit: Octokit; installationId: number }> {
    const APP_ID = getEnv('GITHUB_APP_ID');
    const PRIVATE_KEY = getEnv('GITHUB_APP_PRIVATE_KEY');

    const jwtToken = generateJwt(APP_ID, PRIVATE_KEY);
    const installationId = await getInstallationId(repoName, jwtToken);

    try {
        Logger.info(`Creating Octokit instance`, { repository: repoName });

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: APP_ID,
                privateKey: PRIVATE_KEY,
                installationId: installationId
            }
        });

        return { octokit, installationId };
    } catch (error) {
        throwCreatingOctokitError(error, { appId: APP_ID, installationId, repoName });
    }
}

export async function getOctokitLight(): Promise<Octokit> {
    const accessToken = getEnv('GITHUB_ACCESS_TOKEN');

    return new Octokit({ auth: accessToken });
}

const throwCreatingOctokitError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.createOctokit), error, context);
    throw new OctokitError(ADAPTLY_ERRORS.createOctokit, context);
};

/**
 * Generates a JWT.
 * Docs: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app
 * @param appId - APP_ID for the GitHub App
 * @param pem - PRIVATE_KEY generated for the GitHub App
 * @returns the JWT
 */
function generateJwt(appId: string, pem: string): string {
    const payload = {
        // Issued at time
        iat: Math.floor(Date.now() / 1000),
        // JWT expiration time (10 minutes maximum)
        exp: Math.floor(Date.now() / 1000) + 600,
        // GitHub App's identifier
        iss: appId
    };

    // Create JWT
    const encodedJwt = jwt.sign(payload, pem, { algorithm: 'RS256' });

    Logger.info(`Generated JWT token for Adaptly app`, { appId });

    return encodedJwt;
}

// Docs: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
const getInstallationId = async (repoName: string, jwtToken: string): Promise<number> => {
    const headers = {
        Authorization: `Bearer ${jwtToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    const [owner, repo] = repoName.split('/');
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/installation`;

    try {
        const response = await axios.get(url, { headers });

        Logger.info(`Got installation_id`, { repository: repoName });

        return response.data.id;
    } catch (error) {
        throwGettingInstallationIdError(error, { repoName, url });
    }
};

const throwGettingInstallationIdError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.getInstallationId), error, context);

    throw new OctokitError(ADAPTLY_ERRORS.getInstallationId, context);
};
