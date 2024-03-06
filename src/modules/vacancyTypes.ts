import { Group, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { GroupMeta, GroupSupervisor } from './groupTypes';

export interface VacancyGroup {
    group: Group & GroupSupervisor & GroupMeta;
}

export interface VacancyUser {
    user: Nullish<User>;
}

export interface VacancyHr {
    hr: User;
}

export interface VacancyHiringManager {
    hiringManager: User;
}
