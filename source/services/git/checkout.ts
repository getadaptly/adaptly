import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, AdaptlyError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import git from 'simple-git';

export async function checkout(destinationPath: string, commitHash: string): Promise<void> {
    try {
        await git(destinationPath).checkout(commitHash);

        Logger.info(`Checked out folder at commit`, { commitHash, destinationPath });
    } catch (error) {
        throwCheckoutError(error, { commitHash, destinationPath });
    }
}

const throwCheckoutError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.repoCheckoutError), error, context);

    throw new AdaptlyError(ADAPTLY_ERRORS.repoCheckoutError, context);
};
