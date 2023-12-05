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
    organizationUnitId: z.string(),
    groupId: z.string().nullish(),
    supervisorId: z.string().nullish(),
});
export type CreateUser = z.infer<typeof createUserSchema>;

export const addUserToGroupSchema = z.object({
    userId: z.string(),
    groupId: z.string(),
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
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetUserList = z.infer<typeof getUserListSchema>;

export const editUserSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    supervisorId: z.string().nullish(),
});

export type EditUser = z.infer<typeof editUserSchema>;

export const editUserSettingsSchema = z.object({
    theme: z.enum(themes).optional(),
});
export type EditUserSettings = z.infer<typeof editUserSettingsSchema>;

export const getUserSuggestionsSchema = z.object({
    query: z.string(),
    take: z.number().optional(),
    include: z.array(z.string()).optional(),
});

export type GetUserSuggestions = z.infer<typeof getUserSuggestionsSchema>;
