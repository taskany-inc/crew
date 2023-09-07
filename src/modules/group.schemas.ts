import { z } from 'zod';

export const createGroupSchema = z.object({
    name: z.string(),
    parentId: z.string().optional(),
});
export type CreateGroup = z.infer<typeof createGroupSchema>;

export const moveGroupSchema = z.object({
    id: z.string(),
    newParentId: z.string(),
});
export type MoveGroup = z.infer<typeof moveGroupSchema>;
