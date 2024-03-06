import { Group, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { GroupSupervisor } from './groupTypes';

export interface VacancyGroup {
    group: Group & GroupSupervisor;
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
