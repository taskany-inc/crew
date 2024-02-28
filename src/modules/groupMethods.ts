import { Group, Prisma } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { objByKey, objByKeyMulti } from '../utils/objByKey';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { createCsvDocument } from '../utils/csv';

import { CreateGroup, EditGroup, GetGroupList, MoveGroup, GetGroupSuggestions } from './groupSchemas';
import { tr } from './modules.i18n';
import { MembershipInfo } from './userTypes';
import { GroupMeta, GroupParent, GroupSupervisor } from './groupTypes';
import { groupAccess } from './groupAccess';

export const addCalculatedGroupFields = <T extends Group>(group: T, sessionUser?: SessionUser): T & GroupMeta => {
    if (!sessionUser) {
        return {
            ...group,
            meta: {
                create: false,
                isEditable: false,
            },
        };
    }
    return {
        ...group,
        meta: {
            create: groupAccess.create(sessionUser).allowed,
            isEditable: groupAccess.isEditable(sessionUser).allowed,
        },
    };
};

export const groupMethods = {
    create: (data: CreateGroup) => {
        return prisma.group.create({ data });
    },

    edit: async ({ groupId, ...data }: EditGroup) => {
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (group?.archived) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived group') });
        return prisma.group.update({ where: { id: groupId, archived: false }, data });
    },

    archive: async (id: string): Promise<Group> => {
        const count = await prisma.group.count({ where: { parentId: id, archived: false } });
        if (count > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot archive group with children') });
        const [group] = await prisma.$transaction([
            prisma.group.update({ where: { id }, data: { archived: true } }),
            prisma.membership.updateMany({ where: { groupId: id }, data: { archived: true } }),
        ]);
        return group;
    },

    unarchive: async (id: string): Promise<Group> => {
        const group = await prisma.group.findUnique({ where: { id }, include: { parent: true } });
        if (group?.parent && group.parent.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot unarchive group with archived parent') });
        }
        const [updatedGroup] = await prisma.$transaction([
            prisma.group.update({ where: { id, parent: { archived: false } }, data: { archived: false } }),
            prisma.membership.updateMany({ where: { groupId: id }, data: { archived: false } }),
        ]);
        return updatedGroup;
    },

    delete: async (id: string) => {
        const count = await prisma.group.count({ where: { parentId: id } });
        if (count > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot delete group with children') });
        return prisma.group.delete({ where: { id } });
    },

    move: async (data: MoveGroup) => {
        const groupToMove = await prisma.group.findUnique({ where: { id: data.id } });
        if (groupToMove?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move archived group') });
        }
        if (data.newParentId) {
            const newParent = await prisma.group.findUnique({ where: { id: data.newParentId } });
            if (newParent?.archived) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move group into archived group') });
            }
        }
        if (data.id === data.newParentId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move group inside itself') });
        }
        if (data.newParentId) {
            const breadcrumbs = await groupMethods.getBreadcrumbs(data.newParentId);
            if (breadcrumbs.find((group) => group.id === data.id)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot move group inside its child') });
            }
        }
        return prisma.group.update({ where: { id: data.id }, data: { parentId: data.newParentId } });
    },

    getRoots: () => {
        return prisma.group.findMany({ where: { parentId: null, archived: false } });
    },

    getByIds: async (ids: string[], sessionUser?: SessionUser) => {
        const groups = await prisma.group.findMany({
            where: {
                id: {
                    in: ids,
                },
                archived: false,
            },
            include: {
                parent: true,
                supervisor: true,
                memberships: {
                    include: {
                        group: true,
                        user: true,
                        roles: true,
                    },
                },
            },
        });

        groups.forEach((group) => addCalculatedGroupFields(group, sessionUser));

        return groups;
    },

    getById: async (
        id: string,
        sessionUser?: SessionUser,
    ): Promise<Group & GroupMeta & GroupParent & GroupSupervisor> => {
        const group = await prisma.group.findUnique({
            where: { id, archived: false },
            include: { parent: true, supervisor: true },
        });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id }) });
        if (group.archived) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Group is archived') });
        return addCalculatedGroupFields(group, sessionUser);
    },

    getChildren: (id: string) => {
        return prisma.group.findMany({ where: { parentId: id, archived: false } });
    },

    getList: ({ search, filter, take = 10, skip }: GetGroupList) => {
        return prisma.group.findMany({
            where: {
                name: { contains: search, mode: 'insensitive' },
                archived: false,
                id: { notIn: [...(filter || [])] },
            },
            take,
            skip,
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
            where: { groupId: id, archived: false },
            include: { group: true, user: true, roles: true },
        });
    },

    getHierarchy: async (id: string) => {
        const groups = await prisma.$queryRaw<Group[]>`
            WITH RECURSIVE rectree AS (
                SELECT *
                FROM public."Group"
                WHERE id = ${id} AND archived = FALSE
            UNION ALL
                SELECT g.*
                FROM public."Group" g
                JOIN rectree
                    ON g."parentId" = rectree.id
                WHERE g.archived = FALSE
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

    exportMembers: async (groupId: string): Promise<string> => {
        const hierarchy = await groupMethods.getHierarchy(groupId);
        const groupIds = Object.keys(hierarchy.dict);
        const memberships = await prisma.membership.findMany({
            where: { groupId: { in: groupIds } },
            select: {
                user: { select: { name: true, email: true } },
                group: { select: { name: true } },
                roles: { select: { name: true } },
                groupId: true,
                percentage: true,
            },
        });
        const membershipsDict = objByKeyMulti(memberships, 'groupId');
        const data: {
            userName: string | null;
            email: string;
            roles: string;
            percentage: number | string;
            path: string;
        }[] = [];

        const processGroupsRecursively = (ids: string[], currentPath: string[]) => {
            ids.forEach((id) => {
                membershipsDict[id].forEach((m) => {
                    data.push({
                        userName: m.user.name,
                        email: m.user.email,
                        roles: m.roles.map((r) => r.name).join(', '),
                        percentage: m.percentage === null ? '' : m.percentage,
                        path: [...currentPath, m.group.name].join(' / '),
                    });
                });
            });
            ids.forEach((id) => {
                processGroupsRecursively(hierarchy.adjacencyList[id], [...currentPath, hierarchy.dict[id].name]);
            });
        };

        processGroupsRecursively([groupId], []);

        return createCsvDocument(data, [
            { key: 'userName', name: tr('Full name') },
            { key: 'email', name: 'Email' },
            { key: 'roles', name: tr('Roles') },
            { key: 'percentage', name: tr('Membership percentage') },
            { key: 'path', name: tr('Team') },
        ]);
    },

    suggestions: async ({ query, include, take = suggestionsTake }: GetGroupSuggestions) => {
        const where: Prisma.GroupWhereInput = { name: { contains: query, mode: 'insensitive' } };

        if (include) {
            where.id = { notIn: include };
        }

        const suggestions = await prisma.group.findMany({ where, take });

        if (include) {
            const includes = await prisma.group.findMany({ where: { id: { in: include } } });
            suggestions.push(...includes);
        }

        return suggestions;
    },
};
