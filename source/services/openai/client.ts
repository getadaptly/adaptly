import { getEnv } from '@adaptly/env';
import { Configuration, OpenAIApi } from 'openai';

export const NUM_TOKENS = 1000;
export const MAX_NUM_TOKENS_8K = 8191;
export const MAX_NUM_TOKENS_16K = 16383;

export const GPT35_MODEL = 'gpt-3.5-turbo-16k-0613';
export const GPT4_MODEL = 'gpt-4-0613';

const configuration = new Configuration({
    apiKey: getEnv('OPENAI_API_KEY'),
    basePath: 'https://oai.hconeai.com/v1',
    baseOptions: {
        headers: {
            'Helicone-Auth': `Bearer ${getEnv('HELICONE_API_KEY')}`,
            'Helicone-Property-App': getEnv('ENVIRONMENT')
        }
    }
});

export const openai = new OpenAIApi(configuration);
