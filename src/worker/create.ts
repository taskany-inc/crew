import { db } from '../utils/db';
import { config } from '../config';
import { ExternalUserUpdate } from '../modules/externalUserTypes';

export enum jobState {
    scheduled = 'scheduled',
    pending = 'pending',
    completed = 'completed',
}

export interface JobDataMap {
    scheduledDeactivation: {
        userId: string;
        method?: ExternalUserUpdate['method'];
        userCreationRequestId?: string;
        scheduledDeactivationId?: string;
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
    editUserOnScheduledRequest: {
        userCreationRequestId: string;
    };
    activateUserSupplementalPosition: {
        supplementalPositionId: string;
        userId: string;
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

    if (kind === 'createProfile' || kind === 'resolveDecree' || kind === 'editUserOnScheduledRequest') {
        const { userCreationRequestId } = data as JobDataMap['createProfile'];
        await db
            .updateTable('UserCreationRequest')
            .set({ jobId: job.id })
            .where('id', '=', userCreationRequestId)
            .execute();
    }

    if (kind === 'activateUserSupplementalPosition' || kind === 'scheduledFiringFromSupplementalPosition') {
        const { supplementalPositionId } = data as JobDataMap['activateUserSupplementalPosition'];
        await db
            .updateTable('SupplementalPosition')
            .set({ jobId: job.id })
            .where('id', '=', supplementalPositionId)
            .execute();
    }

    if (kind === 'scheduledDeactivation') {
        const { scheduledDeactivationId, userCreationRequestId } = data as JobDataMap['scheduledDeactivation'];

        scheduledDeactivationId &&
            (await db
                .updateTable('ScheduledDeactivation')
                .set({ jobId: job.id })
                .where('id', '=', scheduledDeactivationId)
                .execute());

        userCreationRequestId &&
            (await db
                .updateTable('UserCreationRequest')
                .set({ disableAccountJobId: job.id })
                .where('id', '=', userCreationRequestId)
                .execute());
    }

    return job;
}
