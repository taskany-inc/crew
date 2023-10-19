import { Group, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

import { groupAccess } from './group.access';

export type GroupMeta = { meta: Record<keyof typeof groupAccess, boolean> };

export type GroupHierarchy = {
    adjacencyList: Record<string, string[]>;
    groups: Record<string, Group>;
};

export type GroupParent = { parent: Nullish<Group> };

export type GroupSupervisor = { supervisor: Nullish<User> };
