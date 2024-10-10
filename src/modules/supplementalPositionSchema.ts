import { z } from 'zod';

export const addSupplementalPositionToUserSchema = z.object({
    userId: z.string(),
    organizationUnitId: z.string(),
    percentage: z.number(),
    unitId: z.string().optional(),
});

export type AddSupplementalPositionToUser = z.infer<typeof addSupplementalPositionToUserSchema>;

export const removeSupplementalPositionFromUserSchema = z.object({
    userId: z.string(),
    id: z.string(),
});

export type RemoveSupplementalPositionFromUser = z.infer<typeof removeSupplementalPositionFromUserSchema>;
