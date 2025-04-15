import { z } from 'zod';

import {
    dateSchema,
    getCreateUserCreationRequestInternalEmployeeSchema,
    percentageSchema,
} from './userCreationRequestSchemas';
import { tr } from './modules.i18n';
import { UserCreationRequestType } from './userCreationRequestTypes';

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

export const createSupplementalPositionRequestSchema = () =>
    getCreateUserCreationRequestInternalEmployeeSchema()
        .omit({ creationCause: true, date: true, intern: true })
        .extend({
            type: z.literal(UserCreationRequestType.createSuppementalPosition),
            userTargetId: z.string(),
            supplementalPositions: z
                .array(
                    z.object({
                        organizationUnitId: z.string().min(1, { message: tr('Required field') }),
                        percentage: percentageSchema,
                        unitId: z.string().optional(),
                        workStartDate: dateSchema,
                    }),
                )
                .min(1),
        });

export type CreateSupplementalPositionRequest = z.infer<ReturnType<typeof createSupplementalPositionRequestSchema>>;
