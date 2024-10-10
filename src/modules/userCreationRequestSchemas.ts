import { z } from 'zod';

import { tr } from './modules.i18n';

export const createUserCreationRequestBaseSchema = z.object({
    type: z.literal('base'),
    surname: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    firstName: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    middleName: z.string().optional(),
    email: z
        .string({ required_error: tr('Required field') })
        .min(1, { message: tr('Required field') })
        .min(5, { message: tr('Minimum {min} symbols', { min: 5 }) })
        .email(tr('Not a valid email')),
    phone: z
        .string({ required_error: tr('Enter phone number in format +7(900)123-45-67') })
        .min(1, { message: tr('Enter phone number in format +7(900)123-45-67') })
        .min(5, { message: tr('Minimum {min} symbols', { min: 5 }) }),
    login: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    accountingId: z.string().optional(),
    organizationUnitId: z.string({ required_error: tr('Required field'), invalid_type_error: tr('Required field') }),
    groupId: z.string().optional(),
    supervisorId: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    title: z.string().optional(),
    corporateEmail: z.string().optional(),
    osPreference: z.string().optional(),
    createExternalAccount: z.boolean().optional(),
    date: z.date().optional(),
    comment: z.string().optional(),
    attachIds: z.string().array().optional(),
});
export type CreateUserCreationRequestBase = z.infer<typeof createUserCreationRequestBaseSchema>;

export const createUserCreationRequestInternalEmployeeSchema = createUserCreationRequestBaseSchema.extend({
    type: z.literal('internalEmployee'),
    workMode: z
        .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
        .min(1, { message: tr('Required field') }),
    workModeComment: z.string().optional(),
    equipment: z
        .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
        .min(1, { message: tr('Required field') }),
    extraEquipment: z.string().optional(),
    workSpace: z.string().optional(),
    personalEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
    buddyId: z.string().optional(),
    title: z
        .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
        .min(1, { message: tr('Required field') }),
    recruiterId: z.string().optional(),
    coordinatorIds: z.array(z.string()).optional(),
    lineManagerIds: z.array(z.string()).optional(),
    workEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
    location: z.string().min(1, { message: tr('Required field') }),
    creationCause: z.string(),
    unitId: z.string().optional(),
    date: z.date({ invalid_type_error: tr('Required field'), required_error: tr('Required field') }),
    percentage: z
        .number({ required_error: tr('Please enter percentage from 0.01 to 1') })
        .multipleOf(0.01)
        .min(0.01, { message: tr('Please enter percentage from 0.01 to 1') })
        .max(1, { message: tr('Please enter percentage from 0.01 to 1') }),
    supplementalPositions: z
        .array(
            z.object({
                organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                percentage: z
                    .number({ required_error: tr('Please enter percentage from 0.01 to 1') })
                    .multipleOf(0.01)
                    .min(0.01, { message: tr('Please enter percentage from 0.01 to 1') })
                    .max(1, { message: tr('Please enter percentage from 0.01 to 1') }),
                unitId: z.string().optional(),
            }),
        )
        .optional(),
});
export type CreateUserCreationRequestInternalEmployee = z.infer<typeof createUserCreationRequestInternalEmployeeSchema>;

export const createUserCreationRequestExternalEmployeeSchema = createUserCreationRequestBaseSchema.extend({
    type: z.literal('externalEmployee'),
    accountingId: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    externalOrganizationSupervisorLogin: z
        .string()
        .min(1, { message: tr('External employees should have organizational supervisor') }),
    accessToInternalSystems: z.boolean(),
    attachIds: z
        .string()
        .array()
        .nonempty({ message: tr('External employees need an NDA attached') }),
});
export type CreateUserCreationRequestExternalEmployee = z.infer<typeof createUserCreationRequestExternalEmployeeSchema>;

export const createUserCreationRequestSchema = z.discriminatedUnion('type', [
    createUserCreationRequestBaseSchema,
    createUserCreationRequestInternalEmployeeSchema,
    createUserCreationRequestExternalEmployeeSchema,
]);
export type CreateUserCreationRequest = z.infer<typeof createUserCreationRequestSchema>;

export const handleUserCreationRequest = z.object({
    id: z.string(),
    comment: z.string().optional(),
});
export type HandleUserCreationRequest = z.infer<typeof handleUserCreationRequest>;

export const getUserCreationRequestListSchema = z.object({
    active: z.boolean().optional(),
});
export type GetUserCreationRequestList = z.infer<typeof getUserCreationRequestListSchema>;

export const editUserCreationRequestSchema = z.object({
    id: z.string(),
    email: z.string().optional(),
    date: z.date().optional(),
    phone: z.string().optional(),
});
export type EditUserCreationRequest = z.infer<typeof editUserCreationRequestSchema>;
