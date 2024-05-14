import { Group, User, Vacancy } from '@prisma/client';
import { GroupAdmin } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { groupAccess } from './groupAccess';
import { VacancyHiringManager, VacancyHr } from './vacancyTypes';

export interface GroupMeta {
    meta: Record<keyof typeof groupAccess, boolean>;
}

export interface GroupHierarchy {
    adjacencyList: Record<string, string[]>;
    groups: Record<string, Group>;
}

export interface GroupParent {
    parent: Nullish<Group>;
}

export interface GroupSupervisor {
    supervisor: Nullish<User>;
}

export interface GroupVacancies {
    vacancies: Array<Vacancy & VacancyHr & VacancyHiringManager>;
}

export interface GroupAdmins {
    groupAdmin: GroupAdmin;
}

export type GroupAdminInfo = GroupAdmin & { user: User };
