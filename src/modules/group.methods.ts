import { Group } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { objByKey } from '../utils/objByKey';

import { CreateGroup, GetGroupList, MoveGroup } from './group.schemas';
import { tr } from './modules.i18n';
import { MembershipInfo } from './user.types';
import { GroupParent, GroupSupervisor } from './group.types';

export const groupMethods = {
    add: (data: CreateGroup) => {
        return prisma.group.create({ data });
    },

    delete: async (id: string) => {
        const count = await prisma.group.count({ where: { parentId: id } });
        if (count > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot delete group with children') });
        return prisma.group.delete({ where: { id } });
    },

    move: async (data: MoveGroup) => {
        if (data.id === data.newParentId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move group inside itself') });
        }
        const breadcrumbs = await groupMethods.getBreadcrumbs(data.newParentId);
        if (breadcrumbs.find((group) => group.id === data.id)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move group inside its child') });
        }
        return prisma.group.update({ where: { id: data.id }, data: { parentId: data.newParentId } });
    },

    getRoots: () => {
        return prisma.group.findMany({ where: { parentId: null } });
    },

    getById: async (id: string): Promise<Group & GroupParent & GroupSupervisor> => {
        const group = await prisma.group.findUnique({ where: { id }, include: { parent: true, supervisor: true } });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id }) });
        return group;
    },

    getChildren: (id: string) => {
        return prisma.group.findMany({ where: { parentId: id } });
    },

    getByIdWithChildren: (id: string) => {
        return prisma.group.findUnique({ where: { id }, include: { children: true } });
    },

    getList: (data: GetGroupList) => {
        return prisma.group.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },

    getBreadcrumbs: async (id: string) => {
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

    getMemberships: (id: string): Promise<MembershipInfo[]> => {
        return prisma.membership.findMany({
            where: { groupId: id },
            include: { group: true, user: true, roles: true },
        });
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
