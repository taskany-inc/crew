import { z } from 'zod';

export const addUserToGroupSchema = z.object({
    userId: z.string(),
    groupId: z.string(),
});
export type AddUserToGroup = z.infer<typeof addUserToGroupSchema>;
