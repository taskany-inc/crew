import { User } from '@prisma/client';

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
