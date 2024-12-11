import z from 'zod';

import { mailingSettingType } from './userTypes';

export const editAdditionEmailsSchema = z.object({
    organizationUnitId: z.string(),
    mailingType: z.enum(mailingSettingType),
    additionalEmails: z.array(z.string()),
});

export type EditAdditionEmails = z.infer<typeof editAdditionEmailsSchema>;

export const getAdditionEmailsSchema = z.object({
    organizationUnitIds: z.array(z.string()),
    mailingType: z.enum(mailingSettingType),
});

export type GetAdditionEmails = z.infer<typeof getAdditionEmailsSchema>;
