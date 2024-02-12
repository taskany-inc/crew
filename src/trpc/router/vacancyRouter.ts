import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { router, protectedProcedure } from '../trpcBackend';
import { vacancyAccess } from '../../modules/vacancyAccess';
import { createVacancySchema, editVacancySchema, getVacancyListSchema } from '../../modules/vacancySchemas';
import { vacancyMethods } from '../../modules/vacancyMethods';

export const vacancyRouter = router({
    create: protectedProcedure.input(createVacancySchema).mutation(({ input, ctx }) => {
        accessCheck(vacancyAccess.create(ctx.session.user));
        return vacancyMethods.create(input);
    }),
    edit: protectedProcedure.input(editVacancySchema).mutation(({ input, ctx }) => {
        accessCheck(vacancyAccess.isEditable(ctx.session.user));
        return vacancyMethods.edit(input);
    }),

    getList: protectedProcedure.input(getVacancyListSchema).query(({ input }) => {
        return vacancyMethods.getList(input);
    }),

    archive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(vacancyAccess.isEditable(ctx.session.user));
        return vacancyMethods.archive(input);
    }),

    unarchive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(vacancyAccess.isEditable(ctx.session.user));
        return vacancyMethods.unarchive(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(vacancyAccess.isEditable(ctx.session.user));
        return vacancyMethods.delete(input);
    }),
});
