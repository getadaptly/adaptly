import express from 'express';
import { Request, Response } from 'express';
import Logger from '@adaptly/logging/logger';

const serverHealthCheckRoutes = express.Router();

serverHealthCheckRoutes.get('/ping', (req: Request, res: Response) => {
    Logger.info('Health check called');

    return res.status(200).json({
        message: 'pong'
    });
});

export { serverHealthCheckRoutes };
