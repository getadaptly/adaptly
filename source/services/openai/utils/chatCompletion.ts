import Bottleneck from 'bottleneck';
import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import retry from 'retry';
import { openai, MODEL, MAX_NUM_TOKENS } from '@adaptly/services/openai/client';
import { AxiosResponse } from 'axios';

const bottleneck = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000
});

const retryOperation = retry.operation({
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 2000
});

export const chatCompletion = (
    messages: ChatCompletionRequestMessage[],
    model: string = MODEL
): Promise<AxiosResponse<CreateChatCompletionResponse, any>> => {
    return new Promise((resolve, reject) => {
        retryOperation.attempt(async () => {
            try {
                const completion = await bottleneck.schedule(() =>
                    openai.createChatCompletion({
                        model: model,
                        temperature: 0.0,
                        max_tokens: MAX_NUM_TOKENS,
                        messages: messages
                    })
                );
                // @ts-ignore
                resolve(completion);
            } catch (error: any) {
                if (retryOperation.retry(error)) {
                    return;
                }
                reject(error);
            }
        });
    });
};
