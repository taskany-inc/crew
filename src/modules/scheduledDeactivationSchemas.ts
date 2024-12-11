import { z } from 'zod';

import { tr } from './modules.i18n';

const baseSchema = () =>
    z.object({
        userId: z.string(),
        supervisorId: z.string().optional(),
        workMode: z
            .string({ required_error: tr('Obligatory field') })
            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
        workSpace: z.string().optional(),
        lineManagerIds: z.array(z.string()),
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
            .optional(),
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
        phone: z
            .string({ required_error: tr('Obligatory field') })
            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
        email: z
            .string({ required_error: tr('Obligatory field') })
            .min(1, { message: tr('Obligatory field', { min: 1 }) }),
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
            .refine((supplementalPositions) => supplementalPositions.find((s) => !!s.workEndDate), {
                message: tr('Enter date for at least one organization'),
            })
            .optional(),
        applicationForReturnOfEquipment: z.string().optional(),
        workEmail: z.string().optional(),
        groupId: z.string().optional(),
        teamLead: z.string().optional(),
        organizationUnitId: z.string().optional(),
        unitIdString: z.string().optional(),
        deactivateDate: z.date().optional(),
    });

export const createScheduledDeactivationSchema = () =>
    z
        .discriminatedUnion('type', [
            z.object({
                type: z.literal('transfer'),

                deactivateDate: z.date(),
                disableAccount: z.boolean(),
                newOrganizationUnitId: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                newOrganizationRole: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                newTeamLead: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                newTeamLeadId: z.string().optional(),
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
                organizationUnitId: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
                teamLead: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
            }),
            z.object({
                type: z.literal('retirement'),
                disableAccount: z.boolean(),
                newOrganizationUnitId: z.string().optional(),
                newOrganizationRole: z.string().optional(),
                newTeamLead: z.string().optional(),
                organizationRole: z.string().optional(),
                organizationalGroup: z.string().optional(),

                newOrganizationalGroup: z.string().optional(),
                transferPercentage: z.number().optional(),
                supervisorId: z
                    .string({ required_error: tr('Obligatory field') })
                    .min(1, { message: tr('Obligatory field', { min: 1 }) }),
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
                    .refine((supplementalPositions) => supplementalPositions.find((s) => !!s.workEndDate), {
                        message: tr('Enter date for at least one organization'),
                    }),
                lineManagerIds: z.array(z.string()),
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
            }),
        ])
        .and(baseSchema());

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
