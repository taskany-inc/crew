import { z } from 'zod';

import { tr } from './modules.i18n';

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
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetUserList = z.infer<typeof getUserListSchema>;
