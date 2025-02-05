import { Group, User, Vacancy } from '@prisma/client';
import { GroupAdmin, OrganizationUnit, SupplementalPosition } from 'prisma/prisma-client';

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

export interface GroupSupervisorWithPositions {
    supervisor: Nullish<
        User & {
            supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
        }
    >;
}

export interface GroupVacancies {
    vacancies: Array<Vacancy & VacancyHr & VacancyHiringManager & { group: Group }>;
}

export interface GroupAdmins {
    groupAdmin: GroupAdmin;
}

export type GroupAdminInfo = GroupAdmin & { user: User };

export type GroupWithSupervisor = Group & GroupSupervisor;
