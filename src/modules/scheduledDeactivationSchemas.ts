import { z } from 'zod';

import { getPhoneSchema } from '../utils/phoneSchema';

import { tr } from './modules.i18n';

export const createScheduledDeactivationSchema = () =>
    z
        .object({
            type: z.union([z.literal('transfer'), z.literal('retirement')]),
            userId: z.string(),
            disableAccount: z.boolean(),
            phone: getPhoneSchema(),
            title: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            email: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            workEmail: z.string().optional(),
            personalEmail: z.string().optional(),

            supervisorId: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            groupId: z.string().optional(),
            lineManagerIds: z.array(z.string()),
            coordinatorId: z.string().optional(),

            workMode: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            workSpace: z.string().optional(),
            devices: z
                .array(
                    z.object({
                        name: z
                            .string({ required_error: tr('Obligatory field') })
                            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                        id: z
                            .string({ required_error: tr('Obligatory field') })
                            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                    }),
                )
                .min(1),
            testingDevices: z
                .array(
                    z.object({
                        name: z
                            .string({ required_error: tr('Obligatory field') })
                            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                        id: z
                            .string({ required_error: tr('Obligatory field') })
                            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                    }),
                )
                .optional(),
            location: z
                .string({ required_error: tr('Obligatory field') })
                .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            comment: z.string().optional(),
            attachIds: z.array(z.string()).optional(),
            supplementalPositions: z
                .array(
                    z.object({
                        id: z.string(),
                        organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                        percentage: z
                            .number({ required_error: tr('Please enter percentage from 0.01 to 1') })
                            .multipleOf(0.01)
                            .min(0.01, { message: tr('Please enter percentage from 0.01 to 1') })
                            .max(1, { message: tr('Please enter percentage from 0.01 to 1') }),
                        unitId: z.string().optional(),
                        workEndDate: z.date().nullish(),
                    }),
                )
                .min(1)
                .refine((supplementalPositions) => supplementalPositions.find((s) => !!s.workEndDate), {
                    message: tr('Enter date for at least one organization'),
                }),
            applicationForReturnOfEquipment: z.string().optional(),
            newOrganizationUnitId: z.string().optional(),
            newOrganizationRole: z.string().optional(),
            newTeamLead: z.string().optional(),
            newOrganizationalGroup: z.string().optional(),
        })
        .superRefine(({ type, newOrganizationUnitId }, ctx) => {
            if (type === 'transfer' && !newOrganizationUnitId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: tr('Required field'),
                    path: ['newOrganizationUnitId'],
                });
            }
        });

export type CreateScheduledDeactivation = z.infer<ReturnType<typeof createScheduledDeactivationSchema>>;

export const editScheduledDeactivationSchema = () =>
    z.object({ id: z.string() }).and(createScheduledDeactivationSchema());

export type EditScheduledDeactivation = z.infer<ReturnType<typeof editScheduledDeactivationSchema>>;

export const cancelScheduledDeactivationSchema = z.object({
    id: z.string(),
    comment: z.string().optional(),
});

export type CancelScheduledDeactivation = z.infer<typeof cancelScheduledDeactivationSchema>;

export const getScheduledDeactivationListSchema = z.object({
    creatorId: z.string().optional(),
    orderBy: z
        .object({
            deactivateDate: z.enum(['asc', 'desc']).optional(),
            name: z.enum(['asc', 'desc']).optional(),
        })
        .optional(),
    search: z.string().optional(),
});

export type GetScheduledDeactivationList = z.infer<typeof getScheduledDeactivationListSchema>;
