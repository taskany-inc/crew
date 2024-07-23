import { Prisma } from '@prisma/client';

import { prisma } from '../prisma';
import { config } from '../../config';

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
}

export type JobKind = keyof JobDataMap;

interface CreateJobProps<K extends keyof JobDataMap> {
    data: JobDataMap[K];
    priority?: number;
    delay?: number;
    cron?: string;
    date?: Date;
}

export function createJob<K extends keyof JobDataMap>(
    kind: K,
    { data, priority, delay = config.worker.defaultJobDelay, cron, date }: CreateJobProps<K>,
) {
    const createJobData: Prisma.JobCreateInput = {
        state: jobState.scheduled,
        data,
        kind,
        priority,
        delay,
        cron,
        date,
    };

    if (kind === 'createProfile') {
        const { userCreationRequestId } = data as JobDataMap['createProfile'];
        createJobData.userCreationRequest = { connect: { id: userCreationRequestId } };
    }

    return prisma.job.create({
        data: createJobData,
    });
}
