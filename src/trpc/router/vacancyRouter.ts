import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { router, protectedProcedure } from '../trpcBackend';
import { createVacancySchema, editVacancySchema, getVacancyListSchema } from '../../modules/vacancySchemas';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { groupAccess } from '../../modules/groupAccess';

export const vacancyRouter = router({
    create: protectedProcedure.input(createVacancySchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return vacancyMethods.create(input);
    }),

    edit: protectedProcedure.input(editVacancySchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return vacancyMethods.edit(input);
    }),

    getList: protectedProcedure.input(getVacancyListSchema).query(({ input, ctx }) => {
        return vacancyMethods.getList(input, ctx.session.user);
    }),

    archive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return vacancyMethods.archive(input);
    }),

    unarchive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return vacancyMethods.unarchive(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return vacancyMethods.delete(input);
    }),
});
