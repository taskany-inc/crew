import { User, OrganizationUnit, Attach } from '@prisma/client';

import { Nullish } from '../utils/types';

export interface AdditionalDevice {
    name: string;
    id: string;
}

export interface ScheduledDeactivationUser {
    user: User;
}

export interface ScheduledDeactivationCreator {
    creator: User;
}

export interface ScheduledDeactivationOrganizationUnit {
    organizationUnit: Nullish<OrganizationUnit>;
}

export interface ScheduledDeactivationNewOrganizationUnit {
    newOrganizationUnit: Nullish<OrganizationUnit>;
}

export interface ScheduledDeactivationAttaches {
    attaches: Array<Attach>;
}

export const scheduleDeactivateType = ['retirement', 'transfer'] as const;
export type ScheduleDeactivateType = (typeof scheduleDeactivateType)[number];
