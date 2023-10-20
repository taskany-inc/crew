import { Group, Membership, Role } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { userAccess } from './user.access';

export interface User {
    id: string;
    supervisorId?: string | null;
    name?: string | null;
    email: string;
    image?: string | null;
}

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };

export type UserMeta = { meta: Record<keyof typeof userAccess, boolean> };

export type UserMemberships = { memberships: MembershipInfo[] };

export type UserSupervisor = { supervisor: Nullish<User> };
