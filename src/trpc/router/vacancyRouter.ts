import { z } from 'zod';

import { accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { router, protectedProcedure } from '../trpcBackend';
import { createVacancySchema, editVacancySchema, getVacancyListSchema } from '../../modules/vacancySchemas';
import { vacancyMethods } from '../../modules/vacancyMethods';

export const vacancyRouter = router({
    create: protectedProcedure.input(createVacancySchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return vacancyMethods.create(input);
    }),

    edit: protectedProcedure.input(editVacancySchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return vacancyMethods.edit(input);
    }),

    getList: protectedProcedure.input(getVacancyListSchema).query(({ input, ctx }) => {
        return vacancyMethods.getList(input, ctx.session.user);
    }),

    archive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return vacancyMethods.archive(input);
    }),

    unarchive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return vacancyMethods.unarchive(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return vacancyMethods.delete(input);
    }),
});
