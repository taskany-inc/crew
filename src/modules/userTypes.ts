import { Group, Membership, Role, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';
import { Theme } from '../utils/theme';

import { userAccess } from './userAccess';

export interface UserSettings {
    userId: string;
    theme: Theme;
}

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };

export interface UserMeta {
    meta: Record<keyof typeof userAccess, boolean>;
}

export interface UserMemberships {
    memberships: MembershipInfo[];
}

export interface UserSupervisor {
    supervisor: Nullish<User>;
}

export interface UserFilterQuery {
    groupsQuery?: string[];
    rolesQuery?: string[];
    supervisorsQuery?: string[];
    activeQuery?: boolean;
}

export interface ExternalUserUpdate {
    email: string;
    name?: string;
    supervisorId?: string | null;
    active?: boolean;
}
