import { z } from 'zod';

import { themes } from '../utils/theme';

import { tr } from './modules.i18n';

export const createUserSchema = z.object({
    surname: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    firstName: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    middleName: z.string().optional(),
    email: z.string().min(5, { message: tr('Minimum {min} symbols', { min: 5 }) }),
    phone: z.string().min(5, { message: tr('Minimum {min} symbols', { min: 5 }) }),
    login: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 3 }) }),
    accountingId: z.string().optional(),
    organizationUnitId: z.string(),
    groupId: z.string().nullish(),
    supervisorId: z.string().nullish(),
    createExternalAccount: z.boolean().optional(),
});
export type CreateUser = z.infer<typeof createUserSchema>;

export const addUserToGroupSchema = z.object({
    userId: z.string({ required_error: tr('User is required') }),
    groupId: z.string(),
    percentage: z.optional(
        z
            .number({ invalid_type_error: tr('Percentage must be a number') })
            .int(tr('Percentage must be an integer'))
            .min(1, tr('Minimum value is {min}', { min: 1 }))
            .max(100, tr('Maximum value is {max}', { max: 100 })),
    ),
});
export type AddUserToGroup = z.infer<typeof addUserToGroupSchema>;

export const removeUserFromGroupSchema = z.object({
    userId: z.string(),
    groupId: z.string(),
});
export type RemoveUserFromGroup = z.infer<typeof removeUserFromGroupSchema>;

export const getUserListSchema = z.object({
    search: z.string().optional(),
    groupsQuery: z.array(z.string()).optional(),
    rolesQuery: z.array(z.string()).optional(),
    supervisorsQuery: z.array(z.string()).optional(),
    activeQuery: z.boolean().optional(),
    cursor: z.string().nullish(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetUserList = z.infer<typeof getUserListSchema>;

export const getUserByFieldSchema = z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    login: z.string().optional(),
    serviceName: z.string().optional(),
    serviceId: z.string().optional(),
});
export type GetUserByField = z.infer<typeof getUserByFieldSchema>;

export const editUserSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    supervisorId: z.string().nullish(),
});

export type EditUser = z.infer<typeof editUserSchema>;

export const editUserFieldsSchema = editUserSchema.extend({
    organizationUnitId: z.string().optional(),
    email: z.string().optional(),
});

export type EditUserFields = z.infer<typeof editUserFieldsSchema>;

export const editUserActiveStateSchema = z.object({
    id: z.string(),
    active: z.boolean(),
});

export type EditUserActiveState = z.infer<typeof editUserActiveStateSchema>;

export const editUserSettingsSchema = z.object({
    theme: z.enum(themes).optional(),
    showAchievements: z.boolean().optional(),
    locale: z.string().optional(),
});
export type EditUserSettings = z.infer<typeof editUserSettingsSchema>;

export const getUserSuggestionsSchema = z.object({
    query: z.string(),
    take: z.number().optional(),
    include: z.array(z.string()).optional(),
});

export type GetUserSuggestions = z.infer<typeof getUserSuggestionsSchema>;

export const userRestApiDataSchema = z.object({
    id: z.string(),
    surname: z.string(),
    firstName: z.string(),
    middleName: z.string().optional(),
    registrationEmail: z.string().nullish(),
    corporateEmail: z.string(),
    phone: z.string().nullish(),
    login: z.string().nullable(),
    serviceNumber: z.string().nullish(),
    accountingId: z.string().nullish(),
    organizationUnitId: z.string().nullable(),
    groups: z
        .object({
            id: z.string(),
            name: z.string(),
            roles: z.string().array(),
        })
        .array(),
    supervisorLogin: z.string().nullish(),
    active: z.boolean(),
});
export type UserRestApiData = z.infer<typeof userRestApiDataSchema>;
