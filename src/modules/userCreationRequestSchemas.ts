import { z } from 'zod';

import { tr } from './modules.i18n';

export const createUserCreationRequestBaseSchema = z.object({
    type: z.literal('base'),
    surname: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    firstName: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    middleName: z.string().optional(),
    email: z.string().min(5, { message: tr('Minimum {min} symbols', { min: 5 }) }),
    phone: z.string().min(5, { message: tr('Minimum {min} symbols', { min: 5 }) }),
    login: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    accountingId: z.string().optional(),
    organizationUnitId: z.string(),
    groupId: z.string().min(1, { message: tr('Required field') }),
    supervisorId: z.string().min(1, { message: tr('Required field') }),
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
    workMode: z.string().min(1, { message: tr('Required field') }),
    workModeComment: z.string().optional(),
    equipment: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    extraEquipment: z.string().optional(),
    workSpace: z.string().optional(),
    buddyId: z.string().optional(),
    title: z.string().min(1, { message: tr('Required field') }),
    recruiterId: z.string().min(1, { message: tr('Required field') }),
    coordinatorIds: z.array(z.string()).optional(),
    lineManagerIds: z.array(z.string()).optional(),
    workEmail: z.string().optional(),
    location: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    creationCause: z.string(),
    unitId: z.string().optional(),
    date: z.date(),
    supplementalPositions: z
        .array(z.object({ organizationUnitId: z.string(), percentage: z.number(), unitId: z.string() }))
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
