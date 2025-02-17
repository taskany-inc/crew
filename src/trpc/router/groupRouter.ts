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
    getMemberships,
    getMetaByGroupIdsWithFilterByOrgIdSchema,
} from '../../modules/groupSchemas';
import { groupMethods } from '../../modules/groupMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { groupAccess } from '../../modules/groupAccess';
import { accessCheck, checkRoleForAccess, userIsAdminByRole } from '../../utils/access';
import { processEvent } from '../../utils/analyticsEvent';
import { addCalculatedUserFields } from '../../modules/userMethods';
import { Nullish } from '../../utils/types';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { mergeBranches } from '../../utils/mergeBranches';

type SupervisorUserWithMeta = ReturnType<typeof addCalculatedUserFields>;

export interface GroupTree {
    [key: string]: {
        group: {
            id: string;
            name: string;
            supervisorId?: string | null;
            supervisor?: Nullish<SupervisorUserWithMeta>;
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

    getMemberships: protectedProcedure.input(getMemberships).query(async ({ input, ctx }) => {
        return groupMethods.getMemberships(input.groupId, input.filterByOrgId ?? undefined, ctx.session.user);
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

    getGroupTree: protectedProcedure.query(async () => {
        const groups = await groupMethods.getGroupTree();
        const res = mergeBranches(...groups.map(({ childs }) => childs));

        if (res.length === 0) {
            return null;
        }

        return res[0];
    }),

    getGroupTreeByOrgId: protectedProcedure.input(z.string()).query(async ({ input }) => {
        const groups = await groupMethods.getGroupTree(input);

        const res = mergeBranches(...groups.map(({ childs }) => childs));

        if (res.length === 0) {
            return null;
        }

        return res[0];
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

    getGroupMetaByIds: protectedProcedure
        .input(getMetaByGroupIdsWithFilterByOrgIdSchema)
        .query(async ({ input, ctx }) => {
            if (input.ids.length === 0) {
                return {};
            }

            const currentUserIsAdmin = userIsAdminByRole(ctx.session.user.role).allowed;

            const arrayToMap = <T extends { groupId: string }>(array: T[]): Map<string, T> => {
                return new Map<string, T>(array.map((value) => [value.groupId, value]));
            };

            const [mc, vc, sv] = await Promise.all([
                groupMethods.getMembershipCountByIds(input.ids, input.filterByOrgId).then(arrayToMap),
                groupMethods.getVacancyCountsByGroupIds(input.ids).then(arrayToMap),
                groupMethods.getSupervisorByGroupIds(input.ids).then(arrayToMap),
            ]);

            const meta = new Map<
                string,
                { counts: { vacancies?: number; memberships?: number }; supervisor?: Nullish<SupervisorUserWithMeta> }
            >(
                input.ids.map((id) => [
                    id,
                    {
                        counts: {},
                        supervisor: null,
                    },
                ]),
            );

            for (const id of input.ids) {
                const supervisor = sv.get(id);
                meta.set(id, {
                    counts: {
                        /**
                            just don't adding the vacancy count into response
                            if current user haven't admin's role
                        */
                        vacancies: currentUserIsAdmin ? vc.get(id)?.count : undefined,
                        memberships: mc.get(id)?.count,
                    },
                    supervisor: supervisor != null ? addCalculatedUserFields(supervisor, ctx.session.user) : null,
                });
            }

            return Object.fromEntries(meta);
        }),
});
