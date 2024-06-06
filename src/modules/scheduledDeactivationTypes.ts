import { User, OrganizationUnit } from '@prisma/client';

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

export const scheduleDeactivateType = ['retirement', 'transfer'] as const;
