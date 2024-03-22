import { z } from 'zod';

import { tr } from './modules.i18n';

export const createServiceSchema = z.object({
    userId: z.string(),
    serviceId: z
        .string({
            required_error: tr('Title is required'),
        })
        .min(1, {
            message: tr
                .raw('Title must be longer than {min} symbol', {
                    min: 1,
                })
                .join(''),
        }),
    serviceName: z.string({
        invalid_type_error: tr('Choose a service'),
        required_error: tr('Choose a service'),
    }),
});

export type CreateService = z.infer<typeof createServiceSchema>;

export const getServiceListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetServiceList = z.infer<typeof getServiceListSchema>;

export const deleteUserServiceSchema = z.object({
    userId: z.string(),
    serviceName: z.string(),
    serviceId: z.string(),
});

export type DeleteUserService = z.infer<typeof deleteUserServiceSchema>;
