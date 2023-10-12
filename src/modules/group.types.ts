import { Group } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

export type GroupHierarchy = {
    adjacencyList: Record<string, string[]>;
    groups: Record<string, Group>;
};

export type GroupParent = { parent: Nullish<Group> };
