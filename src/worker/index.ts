import * as Sentry from '@sentry/nextjs';

import { config } from '../config';
import { logger } from '../utils/logger';

import { worker, Job } from './worker';
import * as resolve from './resolve';
import { getNextJob, jobDelete, jobUpdate } from './jobOperations';

const retryLimit = config.worker.retryLimit ? parseInt(config.worker.retryLimit, 10) : 3;

const workerLogger = logger.child({ WORKER: true });

workerLogger.info('Worker started successfully');

const onRetryLimitExeed = (error: any, job: Job) =>
    Sentry.captureException(error, {
        fingerprint: ['worker', 'resolve', 'retry'],
        extra: {
            job,
        },
    });

const onQueeTooLong = () => Sentry.captureMessage('Queue too long. Smth went wrong.');

const onError = (error: any, job?: Job) => {
    workerLogger.error('Error in worker', error, job);

    return Sentry.captureException(error, {
        fingerprint: ['worker', 'resolve', 'error'],
        extra: {
            job,
        },
    });
};

const init = () =>
    worker(
        getNextJob,
        jobUpdate,
        jobDelete,
        resolve,
        onRetryLimitExeed,
        onQueeTooLong,
        workerLogger,
        onError,
        config.worker.defaultJobDelay,
        retryLimit,
    );

(() =>
    setInterval(async () => {
        try {
            await init();
        } catch (e) {
            onError(e);
        }
    }, config.worker.queueInterval))();
