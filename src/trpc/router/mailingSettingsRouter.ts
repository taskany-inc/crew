import { editAdditionEmailsSchema, getAdditionEmailsSchema } from '../../modules/mailingSettingsSchemas';
import { protectedProcedure, router } from '../trpcBackend';
import { mailSettingsMethods } from '../../modules/mailSettingsMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const mailSettingsRouter = router({
    additionalEmails: protectedProcedure
        .input(getAdditionEmailsSchema)
        .query(async ({ input }) => mailSettingsMethods.getAdditionEmails(input)),

    editAdditionalEmails: protectedProcedure.input(editAdditionEmailsSchema).mutation(async ({ input, ctx }) => {
        const mailSettingsBefore = await mailSettingsMethods.getAdditionEmails({
            organizationUnitId: input.organizationUnitId,
            mailingType: input.mailingType,
        });
        const updatedMailSettings = await mailSettingsMethods.editAdditionEmails(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'editAdditionalEmailMailingSettings', {
            groupId: undefined,
            userId: undefined,
            before: {
                type: input.mailingType,
                organizationUnitId: input.organizationUnitId,
                additionalEmails: mailSettingsBefore.join(', '),
            },
            after: {
                type: input.mailingType,
                organizationUnitId: input.organizationUnitId,
                additionalEmails: updatedMailSettings.additionalEmails.join(', '),
            },
        });
    }),
});
