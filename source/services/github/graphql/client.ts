import { getEnv } from '@adaptly/env';
import { GraphQLClient } from 'graphql-request';
import retry from 'retry';

const endpoint = 'https://api.github.com/graphql';
const accessToken = getEnv('GITHUB_ACCESS_TOKEN');

const client = new GraphQLClient(endpoint, {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
    }
});

const retryOperation = retry.operation({
    // note(Lauris): every 60 minutes GitHub resets the rate limit. If after 61 retries with
    // 1 minute in between request still fails then it's probably a real error and we should stop
    retries: 61,
    minTimeout: 60000
});

export const runQuery = <T>(query: string, queryArguments: Record<string, unknown>): Promise<T> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        retryOperation.attempt(async () => {
            attempts++;

            try {
                const response: T = await client.request(query, queryArguments);
                resolve(response);
            } catch (error: any) {
                console.log(`Retrying query. Attempt ${attempts}`);
                console.error(error);

                if (retryOperation.retry(error)) {
                    return;
                }
                reject(error);
            }
        });
    });
};
