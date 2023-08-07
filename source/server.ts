import express, { NextFunction, Request } from 'express';
import cors from 'cors';
import Logger from '@adaptly/logging/logger';
import config from '@adaptly/config/server';
import { serverHealthCheckRoutes } from '@adaptly/routes/serverHealthCheck';
import { webhook } from '@adaptly/routes/webhook';
import bodyParser from 'body-parser';
import * as Sentry from '@sentry/node';
import { getEnv } from './env';

// Create server
const app = express();

Sentry.init({
    dsn: getEnv('SENTRY_DSN_KEY'),
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
    ],
    tracesSampleRate: 1.0
});

app.use(
    Sentry.Handlers.requestHandler({
        ip: true
    })
);
app.use(Sentry.Handlers.tracingHandler());

// Parse application/json
app.use(bodyParser.json());

/**
 * Routes.
 */
app.use(serverHealthCheckRoutes);
app.use(webhook);

/**
 * Set up CORS
 */
const corsOptions: cors.CorsOptions = {
    // TODO: possibly replace *
    origin: '*'
};
app.use(cors(corsOptions));

/**
 * Middleware to log requests
 */
app.use((req, res, next) => {
    // Log request
    Logger.info(`METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
    // Log response
    res.on('finish', () => {
        Logger.info(`METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`);
    });
    next();
});

/**
 * Middleware to transform request body into a json object
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Middleware setting rules of this API
 */
app.use((req, res, next) => {
    // TODO: replace * by client URL, to restrict from where the request can come from
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

interface ResponseWithSentry extends express.Response {
    sentry?: string;
}

// Optional fallthrough error handler
app.use(function onError(err: any, req: Request, res: ResponseWithSentry, next: NextFunction): void {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});

/**
 * Start the server
 */
app.listen(config.server.port, () =>
    Logger.info(`Server is running ${config.server.hostname}:${config.server.port} in ${getEnv('ENVIRONMENT')} environment`)
);
