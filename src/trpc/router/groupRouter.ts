import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import {
    createGroupSchema,
    editGroupSchema,
    getGroupListSchema,
    moveGroupSchema,
    getGroupSuggestionsSchema,
    addOrRemoveUserFromGroupAdminsSchema,
    getGroupListByUserId,
} from '../../modules/groupSchemas';
import { groupMethods } from '../../modules/groupMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { groupAccess } from '../../modules/groupAccess';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { processEvent } from '../../utils/analyticsEvent';
import { addCalculatedUserFields } from '../../modules/userMethods';
import { Nullish } from '../../utils/types';
import { vacancyMethods } from '../../modules/vacancyMethods';

type SupervisorUserWithMeta = ReturnType<typeof addCalculatedUserFields>;

export interface GroupTree {
    [key: string]: {
        group: {
            id: string;
            name: string;
            supervisorId: string | null;
            supervisor: Nullish<SupervisorUserWithMeta>;
            counts: {
                memberships?: number;
                vacancies?: number;
            } | null;
        } | null;
        childs: GroupTree | null;
    };
}

export const groupRouter = router({
    create: protectedProcedure.input(createGroupSchema).mutation(async ({ input, ctx }) => {
        if (input.organizational) {
            accessCheck(checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'));
        }

        if (input.parentId) {
            accessCheck(await groupAccess.isEditable(ctx.session.user, input.parentId));
        }

        const result = await groupMethods.create(input, ctx.session.user);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'createGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: {
                name: result.name,
                parentId: result.parentId || undefined,
                virtual: result.virtual,
                organizational: result.organizational,
                supervisorId: result.supervisorId || undefined,
            },
        });

        const { session, headers } = ctx;
        processEvent({
            eventType: 'groupCreate',
            url: headers.referer || '',
            session,
            uaHeader: headers['user-agent'],
            additionalData: {
                groupId: result.id,
                virtual: result.virtual.toString(),
                organizational: result.organizational.toString(),
            },
        });

        return result;
    }),

    edit: protectedProcedure.input(editGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

        const groupBefore = await groupMethods.getByIdOrThrow(input.groupId);
        const result = await groupMethods.edit(input);
        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: groupBefore.name,
                description: groupBefore.description,
                organizational: groupBefore.organizational,
                supervisorId: groupBefore.supervisorId,
            },
            {
                name: result.name,
                description: result.description,
                organizational: result.organizational,
                supervisorId: result.supervisorId,
            },
        );
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editGroup', {
            groupId: result.id,
            userId: undefined,
            before,
            after,
        });
        return result;
    }),

    archive: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input));

        const result = await groupMethods.archive(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'archiveGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: undefined,
        });
        return result;
    }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input));

        const result = await groupMethods.delete(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'deleteGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: undefined,
        });
        return result;
    }),

    move: protectedProcedure.input(moveGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.id));

        const groupBefore = await groupMethods.getByIdOrThrow(input.id);
        const result = await groupMethods.move(input);
        if (groupBefore.parentId !== result.parentId) {
            await historyEventMethods.create({ user: ctx.session.user.id }, 'moveGroup', {
                groupId: result.id,
                userId: undefined,
                before: groupBefore.parentId || undefined,
                after: result.parentId || undefined,
            });
        }
        return result;
    }),

    getRoots: protectedProcedure.query(() => {
        return groupMethods.getRoots();
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return groupMethods.getById(input, ctx.session.user);
    }),

    getChildren: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getChildren(input);
    }),

    getList: protectedProcedure.input(getGroupListSchema).query(({ input }) => {
        return groupMethods.getList(input);
    }),

    getListByUserId: protectedProcedure.input(getGroupListByUserId).query(({ input }) => {
        const { userId, ...rest } = input;

        return groupMethods.getUserList(userId, rest);
    }),

    getUserList: protectedProcedure.input(getGroupListSchema).query(({ input, ctx }) => {
        return groupMethods.getUserList(ctx.session.user.id, input);
    }),

    getBreadcrumbs: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getBreadcrumbs(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
        return groupMethods.getMemberships(input, ctx.session.user);
    }),

    getTreeMembershipsCount: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getTreeMembershipsCount(input);
    }),

    getHierarchy: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getHierarchy(input);
    }),

    exportMembers: protectedProcedure.input(z.string()).mutation(({ input }) => {
        return groupMethods.exportMembers(input);
    }),

    suggestions: protectedProcedure.input(getGroupSuggestionsSchema).query(({ input }) => {
        return groupMethods.suggestions(input);
    }),

    addUserToGroupAdmin: protectedProcedure
        .input(addOrRemoveUserFromGroupAdminsSchema)
        .mutation(async ({ input, ctx }) => {
            accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

            const result = await groupMethods.addUserToGroupAdmins(input);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'addUserToGroupAdmin', {
                groupId: result.groupId,
                userId: result.userId,
                before: undefined,
                after: undefined,
            });

            return result;
        }),

    getGroupAdmins: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return groupMethods.getGroupAdmins(input);
    }),

    removeUserFromGroupAdmin: protectedProcedure
        .input(addOrRemoveUserFromGroupAdminsSchema)
        .mutation(async ({ input, ctx }) => {
            accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

            const result = await groupMethods.removeUserFromGroupAdmins(input);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'removeUserFromGroupAdmin', {
                groupId: result.groupId,
                userId: result.userId,
                before: undefined,
                after: undefined,
            });

            return result;
        }),

    getGroupTree: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
        const arrayToMap = <T extends { groupId: string }>(array: T[]): Map<string, T> => {
            return new Map<string, T>(array.map((value) => [value.groupId, value]));
        };

        const map: GroupTree = {};

        const groups = await groupMethods.getGroupTree(input);
        const groupIds = Array.from(new Set(groups.map(({ id }) => id)));

        if (groupIds.length === 0) {
            return map;
        }

        const meta = await Promise.all([
            groupMethods.getMembershipCountsByGroupIds(groupIds).then(arrayToMap),
            groupMethods.getVacancyCountsByGroupIds(groupIds).then(arrayToMap),
            groupMethods.getSupervisorByGroupIds(groupIds).then(arrayToMap),
        ]).then(([mc, vc, sv]) => {
            const target = new Map<
                string,
                { vacancies?: number; memberships?: number; supervisor?: Nullish<SupervisorUserWithMeta> }
            >();

            for (const id of groupIds) {
                const supervisor = sv.get(id);
                target.set(id, {
                    vacancies: vc.get(id)?.count,
                    memberships: mc.get(id)?.count,
                    supervisor: supervisor != null ? addCalculatedUserFields(supervisor, ctx.session.user) : null,
                });
            }

            return target;
        });
        const sourceMap = new Map(
            groups.map((group) => {
                const { vacancies, memberships, supervisor } = meta.get(group.id) || {};
                return [
                    group.id,
                    {
                        ...group,
                        supervisor,
                        counts: { vacancies, memberships },
                    },
                ];
            }),
        );

        groups.forEach(({ id, chain, level }) => {
            const path = chain.filter(Boolean);

            path.reduce((acc, key, i) => {
                if (!acc[key]) {
                    acc[key] = {
                        group: sourceMap.get(key) ?? null,
                        childs: {
                            [id]: {
                                group: sourceMap.get(id) ?? null,
                                childs: {},
                            },
                        },
                    };
                } else if (i === level) {
                    acc[key].childs = {
                        ...acc[key].childs,
                        [id]: {
                            group: sourceMap.get(id) ?? null,
                            childs: null,
                        },
                    };
                }

                return acc[key].childs as GroupTree;
            }, map);
        });

        return map;
    }),

    getFunctionalGroupCounts: protectedProcedure.input(z.string().optional()).query(async ({ input }) => {
        return Promise.all([groupMethods.count(input), vacancyMethods.count(input)]).then(([mc, vc]) => ({
            ...mc,
            ...vc,
        }));
    }),

    getMothrshipGroup: protectedProcedure.query(async () => {
        return groupMethods.getMothershipGroup();
    }),

    getGroupChidrenVacancies: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return groupMethods.getGroupChidrenVacancies(input);
    }),
});
