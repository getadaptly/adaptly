import { AdaptlyErrorValue } from '@adaptly/errors';
import util from 'util';
import { axiom } from './axiom';
import { getEnv } from '@adaptly/env';

export function getMessage(error: AdaptlyErrorValue) {
    return `${error.code} - ${error.message}`;
}

export default class Logger {
    static info(message: string, context?: Object) {
        const level = 'INFO';

        Logger.ingestIntoAxiom({ level, message, context });
        if (context) {
            console.info(`[${level}] ${message}`, context);
        } else {
            console.info(`[${level}] ${message}`);
        }
    }

    static warn(message: string, context?: Object) {
        const level = 'WARN';

        Logger.ingestIntoAxiom({ level, message, context });
        console.warn(`[${level}] ${message}`, context);
    }

    static error(message: string, error?: Error, context?: Object) {
        const level = 'ERROR';

        const errorFormatted = JSON.stringify(error, Object.getOwnPropertyNames(error));

        Logger.ingestIntoAxiom({ level, message, error: errorFormatted, context });
        console.error(`[${level}] ${message}`, error, context);
    }

    static debug(message: string, object?: Object) {
        const level = 'DEBUG';

        console.debug(`[${level}] ${message} ${util.inspect(object, { showHidden: false, depth: null })}`);
    }

    static ingestIntoAxiom(data: any) {
        try {
            const dataset = getEnv('AXIOM_DATASET');
            axiom.ingestEvents(dataset, data);
        } catch (error) {
            console.log('Failed to ingest into axiom', error);
        }
    }
}
