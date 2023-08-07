import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, OpenAiError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { CreateChatCompletionResponse } from 'openai';

export function getMessageContent(response: CreateChatCompletionResponse) {
    const content = response.choices[0].message?.content;

    if (!content) {
        throwEmptyContent(new Error('Empty response from OpenAI'), { response });
    }

    return content;
}

export const throwEmptyContent: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.openAiEmptyMessageContent), error, context);

    throw new OpenAiError(ADAPTLY_ERRORS.openAiEmptyMessageContent, context);
};
