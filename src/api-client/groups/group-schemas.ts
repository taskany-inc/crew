import { z } from 'zod';

export const getGroupSchema = z.object({
    groupId: z.string(),
});

export type GetGroup = z.infer<typeof getGroupSchema>;

export const getGroupGhildrenSchema = z.object({
    id: z.string(),
});

export type GetGroupChildren = z.infer<typeof getGroupGhildrenSchema>;
