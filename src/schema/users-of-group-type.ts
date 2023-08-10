import { z } from 'zod';

export const getUsersOfGroupIdSchema = z.object({
    groupId: z.string(),
    // items: z.array(z.string()),
});

export type getUsersOfGroupId = z.infer<typeof getUsersOfGroupIdSchema>;
