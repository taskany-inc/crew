import {
    Group,
    Membership,
    Role,
    User,
    UserAchievement,
    Achievement,
    OrganizationUnit,
    UserRole,
    ScheduledDeactivation,
    SupplementalPosition,
    UserService,
} from '@prisma/client';

import { Nullish } from '../utils/types';
import { Theme } from '../utils/theme';

import { GroupMeta } from './groupTypes';
import { userAccess } from './userAccess';
import {
    ScheduledDeactivationAttaches,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationOrganizationUnit,
} from './scheduledDeactivationTypes';
import { Location } from './locationTypes';

export interface UserSettings {
    userId: string;
    theme: Theme;
    showAchievements: boolean;
    locale: string;
}

export type MembershipInfo = Membership & {
    group: Group & GroupMeta;
    user: User & UserSupplementalPositions;
    roles: Role[];
};

export interface UserMeta {
    meta: Record<keyof typeof userAccess, boolean>;
}

export interface UserNames {
    otherNames: { name: string }[];
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

export interface UserCurators {
    curators: Nullish<User[]>;
}

export interface UserCuratorOf {
    curatorOf: Nullish<User[]>;
}

export interface UserSupervisorIn {
    supervisorIn: Nullish<Group[]>;
}

export interface UserLocation {
    location: Nullish<Location>;
}

export interface UserFilterQuery {
    search?: string;
    groups?: string[];
    includeChildrenGroups?: boolean;
    roles?: string[];
    supervisors?: string[];
    activity?: 'active' | 'inactive';
}

export interface UserAchievements {
    achievements?: Array<UserAchievement & { achievement: Achievement }>;
}

export interface UserOrganizationUnit {
    organizationUnit: Nullish<OrganizationUnit>;
}

export interface UserScheduledDeactivations {
    scheduledDeactivations: Array<
        ScheduledDeactivation &
            ScheduledDeactivationOrganizationUnit &
            ScheduledDeactivationNewOrganizationUnit &
            ScheduledDeactivationAttaches
    >;
}

export interface UserRoleData {
    role: Nullish<UserRole>;
}

export const mailingSettingType = ['createUserRequest', 'createScheduledUserRequest', 'scheduledDeactivation'] as const;

export type MailingSettingType = (typeof mailingSettingType)[number];

export interface UserSupplementalPositions {
    supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
}

export interface UserServices {
    services: Array<UserService>;
}

export type UserWithSuplementalPositions = User & UserSupplementalPositions;
