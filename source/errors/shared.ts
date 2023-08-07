import Logger, { getMessage } from '@adaptly/logging/logger';
import { ErrorHandler, PrismaError } from './types';
import { ADAPTLY_ERRORS } from '.';

export const throwRepositoryNotFound: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.repositoryNotInDatabase), error, context);

    throw new PrismaError(ADAPTLY_ERRORS.repositoryNotInDatabase, context);
};
