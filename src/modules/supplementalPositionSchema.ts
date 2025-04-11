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

export const createSupplementalPositionSchema = addSupplementalPositionToUserSchema.extend({
    userCreationRequestId: z.string().optional(),
    userId: z.string().optional(),
    main: z.boolean().optional(),
    workEndDate: z.date().optional(),
    workStartDate: z.date().optional(),
    userTransferToRequestId: z.string().optional(),
});

export type CreateSupplementalPosition = z.infer<typeof createSupplementalPositionSchema>;

export const updateSupplementalPositionSchema = z.object({
    id: z.string(),
    userId: z.string().optional(),
    organizationUnitId: z.string().optional(),
    percentage: z.number().optional(),
    unitId: z.string().optional(),
    userCreationRequestId: z.string().optional(),
    main: z.boolean().optional(),
    workEndDate: z.date().optional(),
    workStartDate: z.date().optional(),
    userTransferToRequestId: z.string().optional(),
});

export type UpdateSupplementalPosition = z.infer<typeof updateSupplementalPositionSchema>;
