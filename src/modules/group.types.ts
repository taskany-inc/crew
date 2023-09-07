import { Group } from 'prisma/prisma-client';

export type GroupHierarchy = {
    adjacencyList: Record<string, string[]>;
    groups: Record<string, Group>;
};
