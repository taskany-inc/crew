import { sql } from 'kysely';

import { db } from '../utils/db';

import { jobState } from './create';
import { Job, UpdateJobData } from './worker';

export const removeNullsFromJob = (jobWithNulls: Job): Job => {
    return {
        ...jobWithNulls,
        cron: jobWithNulls.cron === null ? undefined : jobWithNulls.cron,
        delay: jobWithNulls.delay === null ? undefined : jobWithNulls.delay,
        retry: jobWithNulls.retry === null ? undefined : jobWithNulls.retry,
        error: jobWithNulls.error === null ? undefined : jobWithNulls.error,
        date: jobWithNulls.date === null ? undefined : jobWithNulls.date,
    };
};
export const getNextJob = async (state: jobState, exclude: string[]): Promise<Job | undefined> => {
    // get first job with state
    // update Status to pending
    // lock before updating

    const [job] = await db
        .with('cte', (qc) =>
            qc
                .selectFrom('Job')
                .where('state', '=', state)
                .$if(exclude.length > 0, (qb) => qb.where(({ eb }) => eb('id', 'not in', exclude)))
                .orderBy('priority desc')
                .limit(1)
                .select(['id'])
                .forUpdate()
                .skipLocked(),
        )
        .updateTable('Job')
        .set('state', jobState.pending)
        .from('cte')
        .whereRef('Job.id', '=', 'cte.id')
        .returningAll()
        .execute();

    if (!job) return;

    return removeNullsFromJob(job);
};

export const jobUpdate = async (id: string, data: UpdateJobData): Promise<void> => {
    const { runs, ...restData } = data;
    await db
        .updateTable('Job')
        .set({ ...restData, runs: runs?.increment ? sql`runs + 1` : undefined })
        .where('id', '=', id)
        .execute();
};

export const jobDelete = async (id: string): Promise<void> => {
    await db.deleteFrom('Job').where('id', '=', id).execute();
};
