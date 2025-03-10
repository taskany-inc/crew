import { Group, Prisma, PositionStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';
import { jsonObjectFrom, jsonBuildObject } from 'kysely/helpers/postgres';

import { prisma } from '../utils/prisma';
import { objByKey, objByKeyMulti } from '../utils/objByKey';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { createCsvDocument } from '../utils/csv';
import { db } from '../utils/db';

import {
    CreateGroup,
    EditGroup,
    GetGroupList,
    MoveGroup,
    GetGroupSuggestions,
    AddOrRemoveUserFromGroupAdmins,
    GetUserGroupList,
} from './groupSchemas';
import { tr } from './modules.i18n';
import { GroupMeta, GroupParent, GroupSupervisorWithPositions, GroupVacancies } from './groupTypes';
import { groupAccess } from './groupAccess';
import { MembershipInfo } from './userTypes';

export const addCalculatedGroupFields = async <T extends Group>(
    group: T,
    sessionUser?: SessionUser,
): Promise<T & GroupMeta> => {
    if (!sessionUser) {
        return {
            ...group,
            meta: {
                isEditable: false,
            },
        };
    }
    return {
        ...group,
        meta: {
            isEditable: (await groupAccess.isEditable(sessionUser, group.id)).allowed,
        },
    };
};

type GroupTreeQueryResult =
    | {
          id: string;
          group: Group;
          children: Array<GroupTreeQueryResult>;
      }
    | {
          id: string;
          group: Group;
          children?: never;
      };

export const groupMethods = {
    getByIdOrThrow: async (id: string): Promise<Group> => {
        const group = await prisma.group.findUnique({ where: { id } });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id }) });
        return group;
    },

    create: (data: CreateGroup, sessionUser?: SessionUser) => {
        return prisma.group.create({ data: { supervisorId: sessionUser?.id, ...data } });
    },

    edit: async ({ groupId, ...data }: EditGroup) => {
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { groupId }) });
        if (group.archived) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived group') });
        if (data.organizational && !group.organizational) {
            const memberships = await prisma.membership.findMany({
                where: { groupId, user: { memberships: { some: { group: { organizational: true } } } } },
            });
            if (memberships.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tr('Multiple organizational memberships are forbidden'),
                });
            }
        }
        return prisma.group.update({ where: { id: groupId, archived: false }, data });
    },

    archive: async (id: string): Promise<Group> => {
        const group = await prisma.group.findUnique({ where: { id } });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id }) });
        const count = await prisma.group.count({ where: { parentId: id, archived: false } });
        if (count > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot archive group with children') });
        const activeVacancyNumber = await prisma.vacancy.count({
            where: { groupId: id, archived: false, status: { not: 'CLOSED' } },
        });
        if (activeVacancyNumber > 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot archive group with active vacancies') });
        }
        const children = await prisma.group.count({ where: { parentId: id, archived: false } });
        if (children > 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot archive group with children') });
        }
        const [updatedGroup] = await prisma.$transaction([
            prisma.group.update({ where: { id }, data: { archived: true } }),
            group.organizational
                ? prisma.membership.deleteMany({ where: { groupId: id } })
                : prisma.membership.updateMany({ where: { groupId: id }, data: { archived: true } }),
        ]);
        return updatedGroup;
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
        return prisma.group.findMany({
            where: { parentId: null, archived: false },
            include: { supervisor: true },
            orderBy: { name: 'asc' },
        });
    },

    getByIds: async (ids: string[]) => {
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

        return groups;
    },

    getById: async (
        id: string,
        sessionUser?: SessionUser,
    ): Promise<Group & GroupMeta & GroupParent & GroupSupervisorWithPositions & GroupVacancies> => {
        const group = await prisma.group.findUnique({
            where: { id, archived: false },
            include: {
                parent: true,
                supervisor: {
                    include: {
                        supplementalPositions: {
                            include: {
                                organizationUnit: true,
                            },
                        },
                    },
                },
                vacancies: {
                    where: { archived: false, status: { not: 'CLOSED' } },
                    include: { hr: true, hiringManager: true, group: true },
                },
            },
        });
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id }) });
        if (group.archived) throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Group is archived') });
        return addCalculatedGroupFields(group, sessionUser);
    },

    getChildren: (id: string) => {
        return prisma.group.findMany({
            where: { parentId: id, archived: false },
            include: { supervisor: true },
            orderBy: { name: 'asc' },
        });
    },

    getVacancyCountsByGroupIds: (ids: string[]) =>
        db
            .selectFrom('Vacancy')
            .select(({ fn, cast }) => [
                'Vacancy.groupId',
                cast<number>(fn.count('Vacancy.id').distinct(), 'integer').as('count'),
            ])
            .where('Vacancy.groupId', 'in', ids)
            .where('Vacancy.archived', 'is not', true)
            .where('Vacancy.userId', 'in', ({ selectFrom }) =>
                selectFrom('User')
                    .select('User.id')
                    .whereRef('User.id', '=', 'Vacancy.userId')
                    .where('User.active', 'is', true),
            )
            .groupBy('Vacancy.groupId')
            .execute(),

    getSupervisorByGroupIds: (ids: string[]) =>
        db
            .with('groups', (qb) => qb.selectFrom('Group').selectAll('Group').where('Group.id', 'in', ids))
            .with('supervisor', (qb) =>
                qb
                    .selectFrom('User')
                    .innerJoin('groups', 'groups.supervisorId', 'User.id')
                    .selectAll('User')
                    .select('User.role as roleDeprecated'),
            )
            .selectFrom('supervisor')
            .innerJoin('groups', 'groups.supervisorId', 'supervisor.id')
            .selectAll('supervisor')
            .select(({ fn }) => ['groups.id as groupId', fn.toJson('groups').as('group')])
            .execute(),

    getList: async ({ search, filter, take = 10, skip = 0, hasVacancies, organizational }: GetGroupList) => {
        const where: Prisma.GroupWhereInput = {
            name: { contains: search, mode: 'insensitive' },
            archived: false,
            organizational,
            id: { notIn: [...(filter || [])] },
        };

        if (hasVacancies) {
            where.vacancies = { some: {} };
        }

        return prisma.group.findMany({
            where,
            take,
            skip,
        });
    },

    getUserList: async (userId: string, { search, filter, take = 10, skip, organizational }: GetUserGroupList) => {
        const searchConditions = [];

        if (search) {
            searchConditions.push(Prisma.sql`name ~* ${search}`);
        }

        if (filter) {
            searchConditions.push(Prisma.sql`id NOT IN (${filter.toString()})`);
        }

        if (typeof organizational === 'boolean') {
            searchConditions.push(Prisma.sql`organizational = ${organizational}`);
        }

        const where = searchConditions.length
            ? Prisma.sql`where ${Prisma.join(searchConditions, ' AND ')}`
            : Prisma.empty;

        return prisma.$queryRaw<Array<Group>>`
            WITH RECURSIVE rectree AS (
                SELECT *
                    FROM "Group"
                    WHERE "Group".id in (
                        SELECT id
                        FROM "Group"
                        LEFT JOIN "GroupAdmin" ON "Group".id = "GroupAdmin"."groupId"
                        WHERE ("GroupAdmin"."userId" = ${userId} OR "Group"."supervisorId" = ${userId})
                    )

                UNION
                    SELECT g.*
                    FROM "Group" g
                    JOIN rectree
                        ON g."parentId" = rectree.id

            ) SELECT * FROM rectree ${where}
            ORDER BY name ASC
            LIMIT ${take} OFFSET ${skip}
        `;
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

    getMemberships: async (
        id: string,
        filterByOrgId?: string,
        sessionUser?: SessionUser,
    ): Promise<MembershipInfo[]> => {
        const memberships = await prisma.membership.findMany({
            where: {
                groupId: id,
                archived: false,
                user: {
                    AND: [
                        {
                            active: true,
                        },
                        {
                            supplementalPositions:
                                filterByOrgId != null
                                    ? {
                                          some: {
                                              organizationUnitId: filterByOrgId,
                                          },
                                      }
                                    : undefined,
                        },
                    ],
                },
            },
            include: {
                group: true,
                roles: true,
                user: {
                    include: {
                        supplementalPositions: {
                            include: {
                                organizationUnit: true,
                            },
                        },
                    },
                },
            },
        });

        const isEditable = sessionUser ? (await groupAccess.isEditable(sessionUser, id)).allowed : false;

        return memberships.map((m) => ({ ...m, group: { ...m.group, meta: { isEditable } } }));
    },

    getTreeMembershipsCount: async (id: string) => {
        const userCount = await db
            .withRecursive('rectree', (qc) =>
                qc
                    .selectFrom('Group')
                    .select(['id'])
                    .where('Group.id', '=', id)
                    .where('archived', 'is not', true)
                    .unionAll((qb) =>
                        qb
                            .selectFrom('Group')
                            .select(['Group.id'])
                            .innerJoin('rectree', 'rectree.id', 'Group.parentId')
                            .where('archived', '=', false),
                    ),
            )
            .selectFrom('Membership')
            .where('Membership.archived', 'is not', true)
            .innerJoin('rectree', 'rectree.id', 'Membership.groupId')
            .innerJoin('User', 'User.id', 'Membership.userId')
            .select(({ fn }) => fn.count<number>('User.id').distinct().as('count'))
            .where('User.active', '=', true)
            .executeTakeFirstOrThrow();

        return Number(userCount.count);
    },

    getMembershipCountByIds: (params: { ids: string[]; orgId?: string; organizational?: boolean }) =>
        db
            .withRecursive('linked_groups', (qb) =>
                qb
                    .selectFrom('Group')
                    .select(({ fn }) => [
                        'Group.id as targetGroupId',
                        'Group.id as parentId',
                        fn.agg<string[]>('array_agg', ['Group.id']).as('childs'),
                    ])
                    .where('Group.id', 'in', params.ids)
                    .groupBy('targetGroupId')
                    .union(
                        qb
                            .selectFrom('linked_groups')
                            .innerJoin('Group as child_group', (join) =>
                                join.onRef('child_group.parentId', '=', 'linked_groups.parentId').on(({ and, eb }) => {
                                    const baseAnd = [eb('child_group.archived', 'is not', true)];

                                    if (params.organizational) {
                                        baseAnd.push(eb('child_group.organizational', 'is', true));
                                    } else {
                                        baseAnd.push(eb('child_group.organizational', 'is not', true));
                                    }

                                    return and(baseAnd);
                                }),
                            )
                            .select(({ fn, ref }) => [
                                ref('linked_groups.targetGroupId').as('targetGroupId'),
                                ref('child_group.id').as('parentId'),
                                fn
                                    .agg<string[]>('array_append', [ref('linked_groups.childs'), 'child_group.id'])
                                    .as('childs'),
                            ]),
                    ),
            )
            .with('groupped_by_target', (qb) =>
                qb
                    .selectFrom('linked_groups')
                    .select(({ fn }) => [
                        'linked_groups.targetGroupId',
                        fn('unnest', ['linked_groups.childs']).as('childId'),
                    ]),
            )
            .selectFrom('Membership')
            .innerJoin('groupped_by_target', 'groupped_by_target.childId', 'Membership.groupId')
            .innerJoin('User', 'Membership.userId', 'User.id')
            .innerJoin('SupplementalPosition', (join) =>
                join
                    .onRef('Membership.userId', '=', 'SupplementalPosition.userId')
                    .on('SupplementalPosition.main', 'is', true)
                    .on('SupplementalPosition.status', '=', PositionStatus.ACTIVE),
            )
            .select(({ fn }) => [
                'groupped_by_target.targetGroupId as groupId',
                fn.count<number>('Membership.userId').distinct().as('count'),
            ])
            .where('Membership.archived', 'is not', true)
            .where('User.active', 'is', true)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .$if(params.orgId != null, (qb) => qb.where('SupplementalPosition.organizationUnitId', '=', params.orgId!))
            .groupBy('groupped_by_target.targetGroupId')
            .execute(),

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

    getDeepChildrenIds: async (groupIds: string[]) => {
        const children = await db
            .withRecursive('rectree', (qc) =>
                qc
                    .selectFrom('Group')
                    .select(['id'])
                    .where('id', 'in', groupIds)
                    .where('archived', '=', false)
                    .unionAll((qb) =>
                        qb
                            .selectFrom('Group')
                            .select(['Group.id'])
                            .innerJoin('rectree', 'rectree.id', 'Group.parentId')
                            .where('archived', '=', false),
                    ),
            )
            .selectFrom('rectree')
            .selectAll()
            .execute();
        return children.map(({ id }) => id);
    },

    exportMembers: async (groupId: string): Promise<string> => {
        const hierarchy = await groupMethods.getHierarchy(groupId);
        const groupIds = Object.keys(hierarchy.dict);
        const memberships = await prisma.membership.findMany({
            where: { groupId: { in: groupIds }, user: { active: true } },
            select: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        organizationUnit: true,
                        supplementalPositions: { include: { organizationUnit: true } },
                    },
                },
                group: { select: { name: true } },
                roles: { select: { name: true } },
                groupId: true,
                percentage: true,
            },
        });
        const membershipsDict = objByKeyMulti(memberships, 'groupId');
        const data: {
            userName: string | null;
            orgUnitName: string | undefined;
            supplemental: string;
            email: string;
            roles: string;
            percentage: number | string;
            path: string;
        }[] = [];

        const processGroupsRecursively = (ids: string[], currentPath: string[]) => {
            ids.forEach((id) => {
                membershipsDict[id]?.forEach((m) => {
                    data.push({
                        userName: m.user.name,
                        orgUnitName: m.user.organizationUnit?.name || '',
                        supplemental: m.user.supplementalPositions
                            .map(({ organizationUnit }) => organizationUnit.name)
                            .join(', '),
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
            { key: 'orgUnitName', name: tr('Organization') },
            { key: 'supplemental', name: tr('Supplemental positions') },
            { key: 'email', name: 'Email' },
            { key: 'roles', name: tr('Roles') },
            { key: 'percentage', name: tr('Membership percentage') },
            { key: 'path', name: tr('Team') },
        ]);
    },

    suggestions: async ({ query, include, take = suggestionsTake, organizational }: GetGroupSuggestions) => {
        const where: Prisma.GroupWhereInput = { name: { contains: query, mode: 'insensitive' }, organizational };

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

    addUserToGroupAdmins: async (data: AddOrRemoveUserFromGroupAdmins) => {
        const groupAdmin = await prisma.groupAdmin.findUnique({
            where: { userId_groupId: { userId: data.userId, groupId: data.groupId } },
        });
        if (groupAdmin) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('User is already in group administrators') });
        }

        return prisma.groupAdmin.create({ data });
    },

    getGroupAdmins: async (groupId: string) => {
        const groupAdmins = await prisma.groupAdmin.findMany({
            where: { groupId },
            include: { user: true },
        });
        return groupAdmins;
    },

    removeUserFromGroupAdmins: async (data: AddOrRemoveUserFromGroupAdmins) => {
        return prisma.groupAdmin.delete({
            where: {
                userId: data.userId,
                userId_groupId: { userId: data.userId, groupId: data.groupId },
            },
        });
    },

    count: (id?: string) => {
        return db
            .selectFrom('Membership')
            .select(({ fn, cast }) => [
                cast<number>(fn.count('Membership.userId').distinct(), 'integer').as('membership'),
            ])
            .where('Membership.archived', 'is not', true)
            .$if(id != null, (qb) => qb.where('Membership.groupId', '=', id!))
            .executeTakeFirst();
    },

    getMothershipGroup: () => {
        return db
            .with('mothership_group_id', (qb) =>
                qb.selectFrom('AppConfig').select('AppConfig.orgGroupId as id').limit(1),
            )
            .selectFrom('Group')
            .selectAll('Group')
            .where('Group.archived', 'is not', true)
            .where('Group.id', 'in', (qb) => qb.selectFrom('mothership_group_id').select('id'))
            .orderBy('Group.updatedAt desc')
            .executeTakeFirstOrThrow();
    },

    getGroupChidrenVacancies: (groupId: string) =>
        db
            .withRecursive('rectree', (qc) =>
                qc
                    .selectFrom('Group')
                    .select(['id'])
                    .where('id', '=', groupId)
                    .where('archived', '=', false)
                    .unionAll((qb) =>
                        qb
                            .selectFrom('Group')
                            .select(['Group.id'])
                            .innerJoin('rectree', 'rectree.id', 'Group.parentId')
                            .where('archived', '=', false),
                    ),
            )
            .selectFrom('Vacancy')
            .where('Vacancy.status', '=', 'ACTIVE')
            .where('Vacancy.archived', 'is not', true)
            .innerJoin('rectree', 'rectree.id', 'Vacancy.groupId')
            .selectAll()
            .select((eb) => [
                'Vacancy.id',
                jsonObjectFrom(
                    eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'Vacancy.hiringManagerId'),
                ).as('hiringManager'),
            ])
            .select((eb) => [
                'Vacancy.id',
                jsonObjectFrom(eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'Vacancy.hrId')).as('hr'),
            ])
            .select((eb) => [
                'Vacancy.id',
                jsonObjectFrom(eb.selectFrom('Group').selectAll().whereRef('Group.id', '=', 'Vacancy.groupId')).as(
                    'group',
                ),
            ])
            .execute(),

    getGroupTreeByOrgId: (orgId: string) => {
        return db
            .withRecursive('tree', (qb) =>
                qb
                    .with('groups', () =>
                        qb
                            .selectFrom('SupplementalPosition')
                            .innerJoin('Membership', (join) =>
                                join
                                    .on('Membership.archived', 'is not', true)
                                    .onRef('Membership.userId', '=', 'SupplementalPosition.userId'),
                            )
                            .innerJoin('Group', (join) =>
                                join.on(({ and, eb, ref }) =>
                                    and([
                                        eb('Group.organizational', 'is', true),
                                        eb('Group.virtual', 'is not', true),
                                        eb('Group.archived', 'is not', true),
                                        eb('Group.id', '=', ref('Membership.groupId')),
                                    ]),
                                ),
                            )
                            .select('Group.id')
                            .where('SupplementalPosition.main', 'is', true)
                            .where('SupplementalPosition.status', '=', PositionStatus.ACTIVE)
                            .$if(orgId != null, (qb) =>
                                qb.where('SupplementalPosition.organizationUnitId', '=', orgId!),
                            )
                            .groupBy('Group.id'),
                    )
                    .selectFrom('Group')
                    .select(({ cast, val, ref, fn }) => [
                        'Group.id',
                        'Group.parentId',
                        cast<number>(val(0), 'integer').as('level'),
                        sql<string[]>`array["Group".name]`.as('path'),
                        cast<GroupTreeQueryResult>(
                            jsonBuildObject({
                                id: ref('Group.id'),
                                group: fn.toJson('Group'),
                            }),
                            'jsonb',
                        ).as('chain'),
                    ])
                    .where('Group.id', 'in', ({ selectFrom }) => selectFrom('groups').select('groups.id'))
                    .where('Group.archived', 'is not', true)
                    .where('Group.organizational', 'is', true)
                    .groupBy('Group.id')
                    .union((qb) =>
                        qb
                            .selectFrom('Group as gr')
                            .innerJoin('tree', 'tree.parentId', 'gr.id')
                            .select(({ ref, fn, cast }) => [
                                ref('gr.id').as('id'),
                                ref('gr.parentId').as('parentId'),
                                sql<number>`"tree".level - 1`.as('level'),
                                fn.agg<string[]>('array_append', ['tree.path', 'gr.name']).as('path'),
                                cast<GroupTreeQueryResult>(
                                    jsonBuildObject({
                                        id: ref('gr.id'),
                                        group: fn.toJson('gr'),
                                        children: sql`json_build_array("tree".chain)`,
                                    }),
                                    'jsonb',
                                ).as('chain'),
                            ])
                            .where('gr.archived', 'is not', true)
                            .where('gr.organizational', 'is', true),
                    ),
            )
            .selectFrom('Group')
            .innerJoin('tree as groups', 'groups.id', 'Group.id')
            .where('Group.archived', 'is', false)
            .where('Group.organizational', 'is', true)
            .select([
                sql`distinct "groups".id`.as('id'),
                sql<number>`"groups".level * -1`.as('level'),
                'groups.chain as childs',
                'groups.path',
            ])
            .where('groups.parentId', 'is', null)
            .orderBy(['level asc', 'path asc'])
            .execute();
    },
    getTeamsTree: (isOrganizational = true) =>
        db
            .withRecursive('meta', (qb) =>
                qb
                    .selectFrom('Group')
                    .select(['Group.id as gid', 'Group.parentId as pid', sql<number>`1::int`.as('level')])
                    .where('Group.parentId', 'is', null)
                    .where('Group.archived', 'is not', true)
                    .where('Group.organizational', 'is', isOrganizational)
                    .union(({ selectFrom }) =>
                        selectFrom('Group as child')
                            .innerJoin('meta', 'meta.gid', 'child.parentId')
                            .select([
                                'child.id as gid',
                                'child.parentId as pid',
                                sql<number>`"meta"."level"::int + 1`.as('level'),
                            ])
                            .where('child.archived', 'is not', true)
                            .where('child.organizational', 'is', isOrganizational),
                    ),
            )
            .with('group', (qb) =>
                qb
                    .selectFrom('Group')
                    .selectAll('Group')
                    .where('Group.id', 'in', qb.selectFrom('meta').select('meta.gid')),
            )
            .withRecursive('subtree', (qb) =>
                qb
                    .selectFrom('meta')
                    .innerJoin('group', 'group.id', 'meta.gid')
                    .select(({ fn, ref, cast }) => [
                        'meta.gid as id',
                        'meta.pid as parentId',
                        cast<GroupTreeQueryResult>(
                            jsonBuildObject({
                                id: ref('meta.gid'),
                                group: fn.toJson('group'),
                            }),
                            'jsonb',
                        ).as('childs'),
                    ])
                    .union(({ selectFrom }) =>
                        selectFrom('meta as parent')
                            .innerJoin('group', 'group.id', 'parent.gid')
                            .innerJoin('subtree', 'subtree.parentId', 'parent.gid')
                            .select(({ fn, ref, cast }) => [
                                ref('parent.gid').as('id'),
                                ref('parent.pid').as('parentId'),
                                cast<GroupTreeQueryResult>(
                                    jsonBuildObject({
                                        id: ref('parent.gid'),
                                        group: fn.toJson('group'),
                                        children: fn.agg('json_build_array', [ref('subtree.childs')]),
                                    }),
                                    'jsonb',
                                ).as('childs'),
                            ]),
                    ),
            )
            .selectFrom('subtree')
            .selectAll('subtree')
            .where('subtree.parentId', 'is', null)
            .$if(isOrganizational, (qb) =>
                qb.where('subtree.id', '=', ({ selectFrom }) =>
                    selectFrom('AppConfig').select('AppConfig.orgGroupId').limit(1),
                ),
            )
            .$if(!isOrganizational, (qb) =>
                qb.union(({ selectFrom }) =>
                    selectFrom('meta')
                        .innerJoin('group', 'group.id', 'meta.gid')
                        .select(({ fn, ref, cast }) => [
                            'meta.gid as id',
                            'meta.pid as parentId',
                            cast<GroupTreeQueryResult>(
                                jsonBuildObject({
                                    id: ref('meta.gid'),
                                    group: fn.toJson('group'),
                                }),
                                'jsonb',
                            ).as('childs'),
                        ])
                        .where('group.organizational', 'is', false)
                        .where('group.archived', 'is not', true)
                        .where('group.parentId', 'is', null),
                ),
            )
            .execute(),
};
