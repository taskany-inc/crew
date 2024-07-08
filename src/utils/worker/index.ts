import * as Sentry from '@sentry/nextjs';

import { config } from '../../config';

import { worker, Job } from './worker';
import * as resolve from './resolve';
import { getNextJob, jobDelete, jobUpdate } from './jobOperations';

const retryLimit = config.worker.retryLimit ? parseInt(config.worker.retryLimit, 10) : 3;

// eslint-disable-next-line no-console
const log = (...rest: unknown[]) => console.log('[WORKER]:', ...rest);

log('Worker started successfully');

const onRetryLimitExeed = (error: any, job: Job) =>
    Sentry.captureException(error, {
        fingerprint: ['worker', 'resolve', 'retry'],
        extra: {
            job,
        },
    });

const onQueeTooLong = () => Sentry.captureMessage('Queue too long. Smth went wrong.');

// eslint-disable-next-line no-console
const onError = (error: any) => console.log('onerror', error.message);

const init = () =>
    worker(
        getNextJob,
        jobUpdate,
        jobDelete,
        resolve,
        onRetryLimitExeed,
        onQueeTooLong,
        log,
        onError,
        config.worker.defaultJobDelay,
        retryLimit,
    );

(() =>
    setInterval(async () => {
        await init();
    }, config.worker.queueInterval))();
