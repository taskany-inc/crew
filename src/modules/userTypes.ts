import { Group, Membership, Role, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';
import { Theme } from '../utils/theme';

import { userAccess } from './userAccess';

export interface UserSettings {
    userId: string;
    theme: Theme;
}

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };

export type UserMeta = { meta: Record<keyof typeof userAccess, boolean> };

export type UserMemberships = { memberships: MembershipInfo[] };

export type UserSupervisor = { supervisor: Nullish<User> };

export type UserFilterQuery = {
    groupsQuery?: string[];
    rolesQuery?: string[];
    supervisorsQuery?: string[];
    activeQuery?: boolean;
};
