import { z } from 'zod';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { getPhoneSchema } from '../utils/phoneSchema';

import { tr } from './modules.i18n';
import { UserCreationRequestType } from './userCreationRequestTypes';

const dateSchema = z
    .date({
        errorMap: () => ({
            message: tr('Required field'),
        }),
    })
    .nullable()
    .refine((date) => date, tr('Required field'))
    .refine((date) => {
        if (!date) return true;
        const year = date.getFullYear();
        return year >= 2000;
    }, tr('Select a date no earlier than 2000'));

const percentageSchema = z
    .number({ required_error: tr('Please enter percentage from 0.01 to 1') })
    .multipleOf(0.01)
    .min(0.01, { message: tr('Please enter percentage from 0.01 to 1') })
    .max(1, { message: tr('Please enter percentage from 0.01 to 1') });

export const getCreateUserCreationRequestBaseSchema = () =>
    z.object({
        type: z.literal('existing'),
        intern: z.boolean(),
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
        externalGroupId: z.string().optional(),
        groupId: z.string().optional(),
        supervisorId: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        title: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        corporateEmail: z.string().optional(),
        osPreference: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        createExternalAccount: z.boolean().optional(),
        date: dateSchema,
        comment: z.string().optional(),
        attachIds: z.string().array().optional(),
        workEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        personalEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        percentage: percentageSchema.optional(),
        unitId: z.string().optional(),
        supplementalPositions: z
            .array(
                z.object({
                    organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                    percentage: percentageSchema,
                    unitId: z.string().optional(),
                    workStartDate: dateSchema,
                }),
            )
            .optional(),
        lineManagerIds: z.array(z.string()).optional(),
    });

export const createUserRequestDraftSchema = z.object({
    externalPersonId: z.string(),
    name: z.string(),
    login: z.string(),
    phone: z.string(),
    registrationEmail: z.string().email(),
    workEmail: z.string().email().optional(),
    position: z.string(),
    supervisorEmail: z.string().email(),
    externalGroupId: z.string().optional(),
    coordinators: z
        .array(
            z.object({
                email: z.string().email(),
            }),
        )
        .optional(),
    lineManagers: z
        .array(
            z.object({
                email: z.string().email(),
            }),
        )
        .optional(),
    location: z.string(),
    transfer: z.boolean().optional(),
    combining: z.boolean().optional(),
    organizations: z.array(
        z.object({
            organizationUnitId: z.string(),
            startDate: z.string(),
            unitId: z.string(),
            percentage: z.number(),
            main: z.boolean().optional(),
        }),
    ),
});

export type CreateUserCreationRequestDraft = z.infer<typeof createUserRequestDraftSchema>;

export type CreateUserCreationRequestBase = z.infer<ReturnType<typeof getCreateUserCreationRequestBaseSchema>>;

export const getCreateUserCreationRequestInternalEmployeeSchema = () =>
    getCreateUserCreationRequestBaseSchema().extend({
        type: z.literal('internalEmployee'),
        status: z.nativeEnum(UserCreationRequestStatus).nullish().optional(),
        phone: getPhoneSchema(),
        workMode: z.string().optional(),
        equipment: z.string().optional(),
        workModeComment: z.string().optional(),
        extraEquipment: z.string().optional(),
        workSpace: z.string().optional(),
        personalEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        buddyId: z.string().optional(),
        recruiterId: z.string().optional(),
        coordinatorIds: z.array(z.string()).optional(),
        lineManagerIds: z.array(z.string()).optional(),
        workEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        location: z.string().min(1, { message: tr('Required field') }),
        creationCause: z.string(),
        unitId: z.string().optional(),
        transferFromGroup: z.string().optional(),
        date: dateSchema,
        osPreference: z.string().optional(),
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
        date: dateSchema,
        lineManagerIds: z.array(z.string()).optional(),
        curatorIds: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        reason: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        permissionToServices: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        supervisorId: z.string().optional(),
        percentage: z.number().optional(),
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
        permissionToServices: z.array(z.string()).refine((ids) => ids.length, tr('Required field')),
        supervisorId: z.string().optional(),
        osPreference: z.string().optional(),
        date: z.date().nullish(),
        percentage: z.number().optional(),
    });

export type CreateUserCreationRequestexternalFromMainOrgEmployee = z.infer<
    ReturnType<typeof getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema>
>;

const getBaseDecreeSchema = () =>
    getCreateUserCreationRequestBaseSchema()
        .omit({
            osPreference: true,
        })
        .extend({
            id: z.string().optional(),
            userTargetId: z.string(),
            coordinatorIds: z.array(z.string()).optional(),
            buddyId: z.string().optional(),
            workMode: z
                .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
                .min(1, { message: tr('Required field') }),
            workModeComment: z.string().optional(),
            equipment: z
                .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
                .min(1, { message: tr('Required field') }),
            extraEquipment: z.string().optional(),
            location: z.string().min(1, { message: tr('Required field') }),
            workSpace: z.string().optional(),
        });

export const getUserToDecreeSchema = () =>
    getBaseDecreeSchema().extend({
        type: z.literal(UserCreationRequestType.toDecree),
        disableAccount: z.boolean().optional(),
        firedOrganizationUnitId: z.string().optional(),
    });

export type UserToDecreeSchema = z.infer<ReturnType<typeof getUserToDecreeSchema>>;

export const getUserFromDecreeSchema = () =>
    getBaseDecreeSchema().extend({
        type: z.literal(UserCreationRequestType.fromDecree),
    });

export type UserFromDecreeSchema = z.infer<ReturnType<typeof getUserFromDecreeSchema>>;

export const userDecreeSchema = z.discriminatedUnion('type', [getUserToDecreeSchema(), getUserFromDecreeSchema()]);

export type UserDecreeSchema = z.infer<typeof userDecreeSchema>;

export const getUserToDecreeEditSchema = () =>
    getUserToDecreeSchema().extend({
        id: z.string(),
    });

export type UserToDecreeEditSchema = z.infer<ReturnType<typeof getUserToDecreeEditSchema>>;

export const getUserFromDecreeEditSchema = () =>
    getUserFromDecreeSchema().extend({
        id: z.string(),
    });

export type UserFromDecreeEditSchema = z.infer<ReturnType<typeof getUserFromDecreeEditSchema>>;

export const userDecreeEditSchema = z.discriminatedUnion('type', [
    getUserToDecreeEditSchema(),
    getUserFromDecreeEditSchema(),
]);

export type UserDecreeEditSchema = z.infer<typeof userDecreeEditSchema>;

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
    type: z.array(z.string()).optional(),
    status: z.nativeEnum(UserCreationRequestStatus).nullish(),
    orderBy: z
        .object({
            date: z.enum(['asc', 'desc']).optional(),
            name: z.enum(['asc', 'desc']).optional(),
            createdAt: z.enum(['asc', 'desc']).optional(),
        })
        .optional(),
    search: z.string().optional(),
});
export type GetUserCreationRequestList = z.infer<typeof getUserCreationRequestListSchema>;

export const editUserCreationRequestSchema = z.object({
    id: z.string(),
    data: createUserCreationRequestSchema,
});
export type EditUserCreationRequest = z.infer<typeof editUserCreationRequestSchema>;

export const transferInternToStaffSchema = () =>
    z.object({
        type: z.literal(UserCreationRequestType.transferInternToStaff),
        surname: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        firstName: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        middleName: z.string().optional(),
        userId: z.string(),
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
        organizationUnitId: z.string({
            required_error: tr('Required field'),
            invalid_type_error: tr('Required field'),
        }),
        groupId: z.string().optional(),
        supervisorId: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        title: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        corporateEmail: z.string().optional(),
        date: dateSchema,
        comment: z.string().optional(),
        attachIds: z.string().array().optional(),
        workEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        personalEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        percentage: percentageSchema.optional(),
        unitId: z.string().optional(),
        supplementalPositions: z
            .array(
                z.object({
                    organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                    percentage: percentageSchema,
                    unitId: z.string().optional(),
                    main: z.boolean().optional(),
                }),
            )
            .optional(),
        lineManagerIds: z.array(z.string()).optional(),
        workMode: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        workModeComment: z.string().optional(),
        workSpace: z.string().optional(),
        location: z.string().min(1, { message: tr('Required field') }),
        internshipOrganizationId: z.string(),
        internshipOrganizationGroup: z.string().optional(),
        internshipRole: z.string().optional(),
        internshipSupervisor: z.string().optional(),
        applicationForReturnOfEquipment: z.string().optional(),
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
    });
export type TransferInternToStaff = z.infer<ReturnType<typeof transferInternToStaffSchema>>;

export const editTransferInternToStaffSchema = () =>
    transferInternToStaffSchema().extend({
        id: z.string(),
    });

export type EditTransferInternToStaff = z.infer<ReturnType<typeof editTransferInternToStaffSchema>>;

export const createTransferInsideSchema = () =>
    z.object({
        type: z.literal(UserCreationRequestType.transferInside),
        disableAccount: z.boolean().optional(),
        userId: z.string(),
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
        title: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        transferToTitle: z.string().optional(),
        organizationUnitId: z.string({
            required_error: tr('Required field'),
            invalid_type_error: tr('Required field'),
        }),
        transferToOrganizationUnitId: z.string({
            required_error: tr('Required field'),
            invalid_type_error: tr('Required field'),
        }),
        transferToGroupId: z.string().optional(),
        groupId: z.string().optional(),
        transferToSupervisorId: z
            .string({ required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        supervisorId: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
        corporateEmail: z.string().optional(),
        date: dateSchema,
        transferToDate: dateSchema,
        attachIds: z.string().array().optional(),
        workEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        personalEmail: z.string().email(tr('Not a valid email')).optional().or(z.literal('')),
        percentage: percentageSchema.optional(),
        unitId: z.string().optional(),
        transferToPercentage: percentageSchema.optional(),
        transferToUnitId: z.string().optional(),
        supplementalPositions: z
            .array(
                z.object({
                    organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                    percentage: percentageSchema,
                    unitId: z.string().optional(),
                    main: z.boolean().optional(),
                }),
            )
            .optional(),
        transferToSupplementalPositions: z
            .array(
                z.object({
                    organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                    percentage: percentageSchema,
                    unitId: z.string().optional(),
                    main: z.boolean().optional(),
                    workStartDate: dateSchema,
                }),
            )
            .optional(),
        lineManagerIds: z.array(z.string()).optional(),
        coordinatorIds: z.array(z.string()).optional(),
        workMode: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        workSpace: z.string().optional(),
        location: z.string().min(1, { message: tr('Required field') }),
        equipment: z
            .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
            .min(1, { message: tr('Required field') }),
        extraEquipment: z.string().optional(),
        comment: z.string().optional(),
    });
export type CreateTransferInside = z.infer<ReturnType<typeof createTransferInsideSchema>>;
