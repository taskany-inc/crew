import { z } from 'zod';
import parsePhoneNumber from 'libphonenumber-js';

import { tr } from './modules.i18n';

const getPhoneSchema = () =>
    z
        .string({ required_error: tr('Enter phone number in format +7(900)123-45-67') })
        .refine((e) => parsePhoneNumber(e, 'RU')?.isValid(), tr('Enter phone number in format +7(900)123-45-67'))
        .transform((e) => String(parsePhoneNumber(e, 'RU')?.number));

export const getCreateUserCreationRequestBaseSchema = () =>
    z.object({
        type: z.literal('base'),
        surname: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        firstName: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        middleName: z.string().optional(),
        email: z
            .string({ required_error: tr('Required field') })
            .min(1, { message: tr('Required field') })
            .min(5, { message: tr('Minimum {min} symbols', { min: 5 }) })
            .email(tr('Not a valid email')),
        phone: getPhoneSchema(),
        login: z
            .string({ required_error: tr('Required field') })
            .min(1, { message: tr('Required field') })
            .regex(/^[a-z0-9]+$/, { message: tr('Login should contain only lowercase letters and digits') }),
        accountingId: z.string().optional(),
        organizationUnitId: z.string({
            required_error: tr('Required field'),
            invalid_type_error: tr('Required field'),
        }),
        groupId: z.string().optional(),
        supervisorId: z.string().optional(),
        title: z.string().optional(),
        corporateEmail: z.string().optional(),
        osPreference: z.string().optional(),
        createExternalAccount: z.boolean().optional(),
        date: z.date().optional(),
        comment: z.string().optional(),
        attachIds: z.string().array().optional(),
    });
export type CreateUserCreationRequestBase = z.infer<ReturnType<typeof getCreateUserCreationRequestBaseSchema>>;

export const getCreateUserCreationRequestInternalEmployeeSchema = () =>
    getCreateUserCreationRequestBaseSchema().extend({
        type: z.literal('internalEmployee'),
        phone: getPhoneSchema(),
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
        supervisorId: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    });
export type CreateUserCreationRequestInternalEmployee = z.infer<
    ReturnType<typeof getCreateUserCreationRequestInternalEmployeeSchema>
>;
export const getCreateUserCreationRequestExternalEmployeeSchema = () =>
    getCreateUserCreationRequestBaseSchema().extend({
        type: z.literal('externalEmployee'),
        accessToInternalSystems: z.boolean(),
        attachIds: z
            .string()
            .array()
            .nonempty({ message: tr('External employees need an NDA attached') }),
        personalEmail: z
            .string({ required_error: tr('Required field') })
            .min(1, { message: tr('Required field') })
            .email(tr('Not a valid email')),
        osPreference: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        date: z.date({ invalid_type_error: tr('Required field'), required_error: tr('Required field') }),
        lineManagerIds: z.array(z.string()).optional(),
        curatorIds: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        reason: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        title: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        permissionToServices: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        supervisorId: z.string().optional(),
    });
export type CreateUserCreationRequestExternalEmployee = z.infer<
    ReturnType<typeof getCreateUserCreationRequestExternalEmployeeSchema>
>;

export const getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema = () =>
    getCreateUserCreationRequestBaseSchema().extend({
        type: z.literal('externalFromMainOrgEmployee'),
        lineManagerIds: z.array(z.string()).optional(),
        curatorIds: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        workEmail: z
            .string({ required_error: tr('Required field') })
            .min(1, { message: tr('Required field') })
            .email(tr('Not a valid email')),
        reason: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        title: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        permissionToServices: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        supervisorId: z.string().optional(),
    });

export type CreateUserCreationRequestexternalFromMainOrgEmployee = z.infer<
    ReturnType<typeof getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema>
>;

// schema for backend validation
export const createUserCreationRequestSchema = z.discriminatedUnion('type', [
    getCreateUserCreationRequestBaseSchema(),
    getCreateUserCreationRequestInternalEmployeeSchema(),
    getCreateUserCreationRequestExternalEmployeeSchema(),
    getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema(),
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
