import { db } from '../utils/db';
import { config } from '../config';

export enum jobState {
    scheduled = 'scheduled',
    pending = 'pending',
    completed = 'completed',
}

export interface JobDataMap {
    scheduledDeactivation: {
        userId: string;
    };
    createProfile: {
        userCreationRequestId: string;
    };
    resolveDecree: {
        userCreationRequestId: string;
    };
    scheduledFiringFromSupplementalPosition: {
        supplementalPositionId: string;
        userId: string;
    };
    transferInternToStaff: {
        userCreationRequestId: string;
    };
    activateUserSupplementalPosition: {
        supplementalPositionId: string;
        userId: string;
    };
    editUserOnTransfer: {
        userCreationRequestId: string;
    };
}

export type JobKind = keyof JobDataMap;

interface CreateJobProps<K extends keyof JobDataMap> {
    data: JobDataMap[K];
    priority?: number;
    delay?: number;
    cron?: string;
    date?: Date;
}

export async function createJob<K extends keyof JobDataMap>(
    kind: K,
    { data, priority, delay = config.worker.defaultJobDelay, cron, date }: CreateJobProps<K>,
) {
    const job = await db
        .insertInto('Job')
        .values({
            state: jobState.scheduled,
            data,
            kind,
            priority,
            delay,
            cron,
            date,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    if (kind === 'createProfile' || kind === 'resolveDecree') {
        const { userCreationRequestId } = data as JobDataMap['createProfile'];
        await db
            .updateTable('UserCreationRequest')
            .set({ jobId: job.id })
            .where('id', '=', userCreationRequestId)
            .execute();
    }

    return job;
}
