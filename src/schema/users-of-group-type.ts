import { z } from 'zod';

export const getUsersOfGroupIdSchema = z.object({
    groupId: z.string(),
});

export type getUsersOfGroupId = z.infer<typeof getUsersOfGroupIdSchema>;
