import { z } from 'zod';

import { tr } from './modules.i18n';

export const createGroupSchema = z.object({
    name: z.string().min(3, { message: tr('Title must be longer than {upTo} symbol', { upTo: 3 }) }),
    parentId: z.string().optional(),
});
export type CreateGroup = z.infer<typeof createGroupSchema>;

export const editGroupSchema = z.object({
    groupId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
});
export type EditGroup = z.infer<typeof editGroupSchema>;

export const moveGroupSchema = z.object({
    id: z.string(),
    newParentId: z.string().nullable(),
});
export type MoveGroup = z.infer<typeof moveGroupSchema>;

export const getGroupListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetGroupList = z.infer<typeof getGroupListSchema>;