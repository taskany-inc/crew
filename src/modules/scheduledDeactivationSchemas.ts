import { z } from 'zod';

import { tr } from './modules.i18n';

const baseSchema = z.object({
    userId: z.string(),
    deactivateDate: z.date({ required_error: tr('Obligatory field') }),
    organization: z
        .string({ required_error: tr('Obligatory field') })
        .min(1, { message: tr('Obligatory field', { min: 1 }) }),
    teamLead: z
        .string({ required_error: tr('Obligatory field') })
        .min(1, { message: tr('Obligatory field', { min: 1 }) }),
    workMode: z
        .string({ required_error: tr('Obligatory field') })
        .min(1, { message: tr('Obligatory field', { min: 1 }) }),
    workModeComment: z.string().optional(),
    unitId: z.number({ required_error: tr('Obligatory field') }),
    devices: z.array(z.object({ name: z.string(), id: z.string() })).optional(),
    testingDevices: z.array(z.object({ name: z.string(), id: z.string() })).optional(),
    phone: z.string({ required_error: tr('Obligatory field') }).min(1, { message: tr('Obligatory field', { min: 1 }) }),
    email: z.string({ required_error: tr('Obligatory field') }).min(1, { message: tr('Obligatory field', { min: 1 }) }),
    location: z
        .string({ required_error: tr('Obligatory field') })
        .min(1, { message: tr('Obligatory field', { min: 1 }) }),
    comments: z.string().optional(),
});

export const createScheduledDeactivationSchema = z
    .discriminatedUnion('type', [
        z.object({
            type: z.literal('transfer'),

            disableAccount: z.boolean(),
            newOrganization: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            newOrganizationRole: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            newTeamLead: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            organizationRole: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            organizationalGroup: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),

            newOrganizationalGroup: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            transferPercentage: z.number().optional(),
        }),
        z.object({
            type: z.literal('retirement'),
            disableAccount: z.literal(true),
            newOrganization: z.string().optional(),
            newOrganizationRole: z.string().optional(),
            newTeamLead: z.string().optional(),
            organizationRole: z.string().optional(),
            organizationalGroup: z.string().optional(),

            newOrganizationalGroup: z.string().optional(),
            transferPercentage: z.number().optional(),
        }),
    ])
    .and(baseSchema);

export type CreateScheduledDeactivation = z.infer<typeof createScheduledDeactivationSchema>;
