import { z } from 'zod';

import { createUserSchema } from './userSchemas';
import { tr } from './modules.i18n';

export const createUserCreationRequestSchema = createUserSchema.extend({
    corporateEmail: z.string().optional(),
    title: z.string().optional(),
    osPreference: z.string().optional(),
    accountingId: z.string().min(1, { message: tr('Minimum {min} symbols', { min: 1 }) }),
    groupId: z.string().min(1, { message: tr('Obligatory field') }),
    supervisorId: z.string().min(1, { message: tr('Obligatory field') }),
});
export type CreateUserCreationRequest = z.infer<typeof createUserCreationRequestSchema>;

export const handleUserCreationRequest = z.object({
    id: z.string(),
    comment: z.string().optional(),
});
export type HandleUserCreationRequest = z.infer<typeof handleUserCreationRequest>;
