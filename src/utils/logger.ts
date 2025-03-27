import pino from 'pino';

import { config } from '../config';

export const logger = pino(
    {
        level: config.logs.minimumLevel,
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    config.logs.file ? pino.destination(config.logs.file) : undefined,
);
