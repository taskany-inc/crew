import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import { createVacancySchema, editVacancySchema, getVacancyListSchema } from '../../modules/vacancySchemas';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { groupAccess } from '../../modules/groupAccess';
import { accessCheck } from '../../utils/access';

export const vacancyRouter = router({
    create: protectedProcedure.input(createVacancySchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

        const result = await vacancyMethods.create(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'createVacancy', {
            groupId: result.groupId,
            userId: undefined,
            before: undefined,
            after: {
                id: result.id,
                name: result.name,
                status: result.status,
                hireStreamId: result.hireStreamId,
                hiringManagerId: result.hiringManagerId,
                hrId: result.hrId,
                grade: result.grade || undefined,
                unit: result.unit || undefined,
            },
        });
        return result;
    }),

    edit: protectedProcedure.input(editVacancySchema).mutation(async ({ input, ctx }) => {
        const vacancyBefore = await vacancyMethods.getByIdOrThrow(input.id);

        accessCheck(await groupAccess.isEditable(ctx.session.user, vacancyBefore.groupId));

        const result = await vacancyMethods.edit(input);
        const { before, after } = dropUnchangedValuesFromEvent(
            {
                status: vacancyBefore.status,
                hiringManagerId: vacancyBefore.hiringManagerId,
                hrId: vacancyBefore.hrId,
                grade: vacancyBefore.grade,
                unit: vacancyBefore.unit,
            },
            {
                status: result.status,
                hiringManagerId: result.hiringManagerId,
                hrId: result.hrId,
                grade: result.grade,
                unit: result.unit,
            },
        );
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editVacancy', {
            groupId: result.groupId,
            userId: undefined,
            before: { id: result.id, name: vacancyBefore.name, ...before },
            after: { id: result.id, name: result.name, ...after },
        });
        return result;
    }),

    getList: protectedProcedure.input(getVacancyListSchema).query(({ input, ctx }) => {
        return vacancyMethods.getList(input, ctx.session.user);
    }),

    archive: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        const vacancy = await vacancyMethods.getById(input);
        accessCheck(await groupAccess.isEditable(ctx.session.user, vacancy.groupId));
        const result = await vacancyMethods.archive(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'archiveVacancy', {
            groupId: result.groupId,
            userId: undefined,
            before: undefined,
            after: { id: result.id, name: result.name },
        });
        return result;
    }),

    unarchive: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        const vacancy = await vacancyMethods.getById(input);
        accessCheck(await groupAccess.isEditable(ctx.session.user, vacancy.groupId));
        const result = await vacancyMethods.unarchive(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'unarchiveVacancy', {
            groupId: result.groupId,
            userId: undefined,
            before: undefined,
            after: { id: result.id, name: result.name },
        });
        return result;
    }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        const vacancy = await vacancyMethods.getById(input);
        accessCheck(await groupAccess.isEditable(ctx.session.user, vacancy.groupId));
        const result = await vacancyMethods.delete(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'deleteVacancy', {
            groupId: result.groupId,
            userId: undefined,
            before: undefined,
            after: { id: result.id, name: result.name },
        });
        return result;
    }),
});
