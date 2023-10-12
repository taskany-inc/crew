import { Group, Membership, Role, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { userAccess } from './user.access';

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };

export type UserMeta = { meta: Record<keyof typeof userAccess, boolean> };

export type UserMemberships = { memberships: MembershipInfo[] };

export type UserSupervisor = { supervisor: Nullish<User> };
