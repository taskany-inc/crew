import { z } from 'zod';

export const getUserSchema = z.object({
    userId: z.string(),
});

export type GetUser = z.infer<typeof getUserSchema>;

export const getUsersOfGroupSchema = z.object({
    groupId: z.string(),
});

export type GetUsersOfGroup = z.infer<typeof getUsersOfGroupSchema>;
