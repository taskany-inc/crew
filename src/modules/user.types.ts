import { Group, Membership, Role, User } from 'prisma/prisma-client';

import { userAccess } from './user.access';

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };

export type UserMeta = { meta: Record<keyof typeof userAccess, boolean> };

export type UserMemberships = { memberships: MembershipInfo[] };
