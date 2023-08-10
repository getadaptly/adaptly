import Logger, { getMessage } from '@adaptly/logging/logger';
import { AdaptlyError, ErrorHandler, PrismaError } from './types';
import { ADAPTLY_ERRORS } from '.';

export const throwRepositoryNotFound: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.repositoryNotInDatabase), error, context);

    throw new PrismaError(ADAPTLY_ERRORS.repositoryNotInDatabase, context);
};

export const throwRequestMissingInformation: ErrorHandler = (error: any, context?: any) => {
    Logger.error(ADAPTLY_ERRORS.requestMissingInformation.message, error, context);

    throw new AdaptlyError(ADAPTLY_ERRORS.requestMissingInformation, context);
};
