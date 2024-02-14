import { Group, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { GroupSupervisor } from './groupTypes';

export type VacancyGroup = {
    group: Group & GroupSupervisor;
};

export type VacancyUser = {
    user: Nullish<User>;
};

export type VacancyHr = {
    hr: User;
};

export type VacancyHiringManager = {
    hiringManager: User;
};
