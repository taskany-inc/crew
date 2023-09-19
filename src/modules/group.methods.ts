import { Group } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { objByKey } from '../utils/objByKey';

import { CreateGroup, GetGroupList, MoveGroup } from './group.schemas';
import { tr } from './modules.i18n';

export const groupMethods = {
    add: (data: CreateGroup) => {
        return prisma.group.create({ data });
    },

    delete: async (id: string) => {
        const count = await prisma.group.count({ where: { parentId: id } });
        if (count > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot delete group with children') });
        return prisma.group.delete({ where: { id } });
    },

    move: (data: MoveGroup) => {
        return prisma.group.update({ where: { id: data.id }, data: { parentId: data.newParentId } });
    },

    getRoots: () => {
        return prisma.group.findMany({ where: { parentId: null } });
    },

    getById: (id: string) => {
        return prisma.group.findUnique({ where: { id } });
    },

    getChildren: (id: string) => {
        return prisma.group.findMany({ where: { parentId: id } });
    },

    getByIdWithChildren: (id: string) => {
        return prisma.group.findUnique({ where: { id }, include: { children: true } });
    },

    getList: (data: GetGroupList) => {
        return prisma.group.findMany({ where: { name: { contains: data.search } }, take: data.take });
    },

    getBreadCrumbs: async (id: string) => {
        const groups = await prisma.$queryRaw<Group[]>`
            WITH RECURSIVE rectree AS (
                SELECT *
                FROM public."Group"
                WHERE id = ${id}
            UNION ALL
                SELECT g.*
                FROM public."Group" g
                JOIN rectree
                    ON g.id = rectree."parentId"
            ) SELECT * FROM rectree;
        `;
        return groups.reverse();
    },

    getMembers: (id: string) => {
        return prisma.membership.findMany({ where: { groupId: id }, include: { user: true } });
    },

    getHierarchy: async (id: string) => {
        const groups = await prisma.$queryRaw<Group[]>`
            WITH RECURSIVE rectree AS (
                SELECT *
                FROM public."Group"
                WHERE id = ${id}
            UNION ALL
                SELECT g.*
                FROM public."Group" g
                JOIN rectree
                    ON g."parentId" = rectree.id
            ) SELECT * FROM rectree;
        `;
        const dict = objByKey(groups, 'id');
        const adjacencyList: Record<string, string[]> = {};
        for (const group of groups) {
            if (!adjacencyList[group.id]) {
                adjacencyList[group.id] = [];
            }
            if (group.parentId !== null) {
                if (!adjacencyList[group.parentId]) {
                    adjacencyList[group.parentId] = [];
                }
                adjacencyList[group.parentId].push(group.id);
            }
        }
        return { adjacencyList, dict };
    },
};
