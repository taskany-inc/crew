import { addOrDeleteEmailSchema, getEmailsSchema } from '../../modules/mailingSettingsSchemas';
import { protectedProcedure, router } from '../trpcBackend';
import { mailSettingsMethods } from '../../modules/mailSettingsMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const mailSettingsRouter = router({
    getEmails: protectedProcedure
        .input(getEmailsSchema)
        .query(async ({ input }) => mailSettingsMethods.getEmails(input)),

    addEmail: protectedProcedure.input(addOrDeleteEmailSchema).mutation(async ({ input, ctx }) => {
        await mailSettingsMethods.addEmail(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'addEmailToMailingSettings', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                type: input.mailingType,
                organizationUnitId: input.organizationUnitId,
                email: input.email,
                workSpaceNotify: input.workSpaceNotify,
            },
        });
    }),

    deleteEmail: protectedProcedure.input(addOrDeleteEmailSchema).mutation(async ({ input, ctx }) => {
        await mailSettingsMethods.deleteEmail(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'addEmailToMailingSettings', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                type: input.mailingType,
                organizationUnitId: input.organizationUnitId,
                email: input.email,
                workSpaceNotify: input.workSpaceNotify || undefined,
            },
        });
    }),
});
