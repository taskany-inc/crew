import { Group, Membership, Role } from 'prisma/prisma-client';

export type UserMembership = Membership & { group: Group; roles: Role[] };
