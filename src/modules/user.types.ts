import { Group, Membership, Role, User } from 'prisma/prisma-client';

export type UserMembership = Membership & { group: Group; user: User; roles: Role[] };
