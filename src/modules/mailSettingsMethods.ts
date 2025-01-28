import { TRPCError } from '@trpc/server';

import { db } from '../utils/db';

import { AddOrDeleteEmail, GetEmails } from './mailingSettingsSchemas';

export const mailSettingsMethods = {
    getEmails: async (data: GetEmails): Promise<string[]> => {
        const emails = await db
            .selectFrom('MailingSettings')
            .select('email')
            .where('email', 'is not', null)
            .where('organizationUnitId', 'in', data.organizationUnitIds)
            .where(({ ref }) => ref(data.mailingType), '=', true)
            .$if(!!data.workSpaceNotify, (qb) => qb.where('workSpaceNotify', '=', true))
            .$if(!data.workSpaceNotify, (qb) => qb.where('workSpaceNotify', '=', false))
            .execute();

        return emails.map(({ email }) => email).filter((e) => e !== null) as string[];
    },

    addEmail: async (data: AddOrDeleteEmail) => {
        const { organizationUnitId, mailingType, email, workSpaceNotify } = data;

        const mailingSetting = await db
            .selectFrom('MailingSettings')
            .select('email')
            .where('email', '=', email)
            .where('organizationUnitId', '=', organizationUnitId)
            .where(({ ref }) => ref(data.mailingType), '=', true)
            .executeTakeFirst();

        if (mailingSetting) {
            throw new TRPCError({
                message: `${email} already exist in  ${mailingType} for organization with id ${organizationUnitId}`,
                code: 'BAD_REQUEST',
            });
        }

        return db
            .insertInto('MailingSettings')
            .values({
                organizationUnitId,
                email,
                [mailingType]: true,
                additionalEmails: [], // Delete after dropping this deprecated column
                workSpaceNotify,
            })
            .executeTakeFirst();
    },

    deleteEmail: async (data: AddOrDeleteEmail) => {
        const deletingSetting = await db
            .selectFrom('MailingSettings')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('email', '=', data.email),
                    eb('organizationUnitId', '=', data.organizationUnitId),
                    eb(({ ref }) => ref(data.mailingType), '=', true),
                ]),
            )
            .executeTakeFirst();

        if (!deletingSetting) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No mail setting with email ${data.email} for ${data.mailingType} in organization with id ${data.organizationUnitId}`,
            });
        }

        return db.deleteFrom('MailingSettings').where('id', '=', deletingSetting.id).executeTakeFirst();
    },
};
