import z from 'zod';

import { mailingSettingType } from './userTypes';

export const addOrDeleteEmailSchema = z.object({
    organizationUnitId: z.string(),
    mailingType: z.enum(mailingSettingType),
    email: z.string(),
    workSpaceNotify: z.boolean().optional(),
});

export type AddOrDeleteEmail = z.infer<typeof addOrDeleteEmailSchema>;

export const getEmailsSchema = z.object({
    organizationUnitIds: z.array(z.string()),
    mailingType: z.enum(mailingSettingType),
    workSpaceNotify: z.boolean().optional(),
});

export type GetEmails = z.infer<typeof getEmailsSchema>;
