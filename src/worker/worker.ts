import pino from 'pino';
import parser from 'cron-parser';

import { JsonValue } from '../utils/jsonValue';

export enum jobState {
    scheduled = 'scheduled',
    pending = 'pending',
    completed = 'completed',
}

export interface Job {
    id: string;
    state: string;
    priority: number;
    kind: string;
    data: JsonValue | unknown;
    delay?: number | null;
    retry?: number | null;
    runs: number;
    force: boolean;
    cron?: string | null;
    error?: string | null;
    date?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateJobData {
    state?: string;
    force?: boolean;
    runs?: { increment: true };
    error?: string;
    retry?: number;
    delay?: number;
    date?: Date;
}

const iterateJobQueue = async (
    state: jobState,
    cb: (job: Job) => Promise<void>,
    getNextJob: (state: jobState, watchedIds: string[]) => Promise<Job | undefined>,
): Promise<number> => {
    const watchedIds: string[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const job = await getNextJob(state, watchedIds);

        if (!job) {
            break;
        }

        watchedIds.push(job.id);
        // eslint-disable-next-line no-await-in-loop
        await cb(job);
    }

    return watchedIds.length;
};

export const worker = async (
    getNextJob: (state: jobState, watchedIds: string[]) => Promise<Job | undefined>,
    jobUpdate: (id: string, data: UpdateJobData) => Promise<void>,
    jobDelete: (id: string) => Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: { [key: string]: (args: any) => any },
    onRetryLimitExeed: (error: unknown, job: Job) => void,
    onQueueTooLong: () => void,
    logger: pino.Logger,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: unknown, job: Job) => void,
    defaultJobDelay: number,
    retryLimit: number,
) => {
    const completedCount = await iterateJobQueue(
        jobState.completed,
        async (job) => {
            setTimeout(async () => {
                if (job && job.cron) {
                    logger.info(`plan cron ${job.id}`);
                    await jobUpdate(job.id, {
                        state: jobState.scheduled,
                    });
                } else {
                    logger.info(`delete job ${job.id}`);
                    await jobDelete(job.id);
                }
            }, 0);
        },
        getNextJob,
    );

    const scheduledCount = await iterateJobQueue(
        jobState.scheduled,
        async (job) => {
            const planJob = () => jobUpdate(job.id, { state: jobState.scheduled });

            if (job.cron) {
                const interval = parser.parseExpression(job.cron, {
                    currentDate: new Date(job.updatedAt),
                });

                if (Number(interval.next().toDate()) > Date.now() && !job.force) {
                    await planJob();

                    return;
                }
            }

            if (!job.date && job.delay && Date.now() - new Date(job.createdAt).valueOf() < job.delay) {
                await planJob();

                return;
            }

            if (job.date && new Date() < job.date) {
                await planJob();

                return;
            }

            setTimeout(async () => {
                try {
                    logger.info(`resolve job ${job.kind} ${job.id}`);

                    await resolve[job.kind](job.data as any);
                    await jobUpdate(job.id, { state: jobState.completed, runs: { increment: true }, force: false });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                    if (job.retry !== retryLimit) {
                        const retry = job.retry ? job.retry + 1 : 1;

                        onError(error, job);

                        logger.info(`retry job ${job.id}`);

                        setTimeout(async () => {
                            await jobUpdate(job.id, {
                                state: jobState.scheduled,
                                error: error?.message,
                                retry,
                                delay: defaultJobDelay * retry,
                            });
                        }, 3000 * retry);
                    } else {
                        onRetryLimitExeed(error, job);

                        logger.warn(`delete job ${job.id} after ${retryLimit} retries`);

                        await jobDelete(job.id);
                    }
                }
            }, 0);
        },
        getNextJob,
    );

    if (completedCount + scheduledCount > 300) {
        onQueueTooLong();
    }
};
