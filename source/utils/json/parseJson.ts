import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, JSONParsingError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';

export function parseJSON(content: string): any {
    try {
        return JSON.parse(content);
    } catch (error) {
        throwJSONParsingError(error, { content });
    }
}

const throwJSONParsingError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.parsingJson), error, context);

    throw new JSONParsingError(ADAPTLY_ERRORS.parsingJson, context);
};
