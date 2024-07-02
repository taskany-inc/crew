import {
    Group,
    Membership,
    Role,
    User,
    UserAchievement,
    Achievement,
    OrganizationUnit,
    UserCreationRequest,
    UserRole,
} from '@prisma/client';

import { Nullish } from '../utils/types';
import { Theme } from '../utils/theme';

import { GroupMeta } from './groupTypes';
import { userAccess } from './userAccess';

export interface UserSettings {
    userId: string;
    theme: Theme;
    showAchievements: boolean;
    locale: string;
}

export type MembershipInfo = Membership & {
    group: Group & GroupMeta;
    user: User & UserOrganizationUnit;
    roles: Role[];
};

export interface UserMeta {
    meta: Record<keyof typeof userAccess, boolean>;
}

export interface UserMemberships {
    memberships: MembershipInfo[];
}

export interface UserSupervisor {
    supervisor: Nullish<User>;
}

export interface UserSupervisorOf {
    supervisorOf: Nullish<User[]>;
}

export interface UserSupervisorIn {
    supervisorIn: Nullish<Group[]>;
}

export interface UserFilterQuery {
    groups?: string[];
    roles?: string[];
    supervisors?: string[];
    active?: boolean;
}

export interface ExternalUserUpdate {
    email: string;
    name?: string;
    supervisorId?: string | null;
    active?: boolean;
}

export interface UserAchievements {
    achievements?: Array<UserAchievement & { achievement: Achievement }>;
}

export interface UserOrganizationUnit {
    organizationUnit: Nullish<OrganizationUnit>;
}

export interface FullyUserCreationRequest extends UserCreationRequest {
    supervisor: User;
    organization: OrganizationUnit;
    group: Group;
    services: Record<'serviceName' | 'serviceId', string>[] | null;
}

export interface UserRoleData {
    role: Nullish<UserRole>;
}

export const mailingSettingType = ['createUserRequest', 'createScheduledUserRequest', 'scheduledDeactivation'] as const;

export type MailingSettingType = (typeof mailingSettingType)[number];
