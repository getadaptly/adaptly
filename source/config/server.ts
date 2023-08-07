import { IS_PRODUCTION } from '@adaptly/env';

const SERVER_HOSTNAME = IS_PRODUCTION ? process.env.RENDER_EXTERNAL_URL : 'localhost';
const SERVER_PORT = 3001;

const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};

const config = {
    server: SERVER
};

export default config;
