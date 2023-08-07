import { ADAPTLY_ERRORS } from './errors';
import { EnvironmentError } from './errors/types';

type Environment = {
    ENVIRONMENT: 'development' | 'production';

    // Database
    DATABASE_URL: string;

    // Github
    GITHUB_ACCESS_TOKEN: string;
    GITHUB_APP_ID: string;
    GITHUB_APP_PRIVATE_KEY: string;

    // OpenAI
    OPENAI_API_KEY: string;

    // Sentry
    SENTRY_DSN_KEY: string;

    // Axiom
    AXIOM_TOKEN: string;
    AXIOM_ORG_ID: string;
    AXIOM_DATASET: string;
};

export const getEnv = <K extends keyof Environment>(key: K): Environment[K] => {
    const value = process.env[key] as Environment[K] | undefined;

    if (typeof value === 'undefined') {
        throw new EnvironmentError(ADAPTLY_ERRORS.missingEnvironmentVariable, { key });
    }

    return value;
};

export const IS_DEVELOPMENT = getEnv('ENVIRONMENT') === 'development';
export const IS_PRODUCTION = getEnv('ENVIRONMENT') === 'production';
