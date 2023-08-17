import Bottleneck from 'bottleneck';
import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import retry from 'retry';
import { openai, GPT35_MODEL } from '@adaptly/services/openai/client';
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
    model = GPT35_MODEL
): Promise<AxiosResponse<CreateChatCompletionResponse, any>> => {
    return new Promise((resolve, reject) => {
        retryOperation.attempt(async () => {
            try {
                const completion = await bottleneck.schedule(() =>
                    openai.createChatCompletion({
                        model: GPT35_MODEL,
                        temperature: 0.0,
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
