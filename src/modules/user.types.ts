import { Group, Membership, Role, User } from 'prisma/prisma-client';

export type MembershipInfo = Membership & { group: Group; user: User; roles: Role[] };
