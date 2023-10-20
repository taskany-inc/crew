import { BonusAction } from 'prisma/prisma-client';
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

export const changeBonusPointsSchema = z.object({
    userId: z.string(),
    action: z.nativeEnum(BonusAction),
    amount: z.number().positive({ message: tr('Amount should be greater than zero') }),
    description: z
        .string({ required_error: tr('Description is required') })
        .min(1, { message: tr('Description must be longer than {upTo} symbol', { upTo: 1 }) }),
});
export type ChangeBonusPoints = z.infer<typeof changeBonusPointsSchema>;

export const getUserListSchema = z.object({
    search: z.string().optional(),
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
