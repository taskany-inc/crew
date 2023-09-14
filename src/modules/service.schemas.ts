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
                .raw('Title must be longer than {upTo} symbol', {
                    upTo: 1,
                })
                .join(''),
        }),
    serviceName: z.string({
        invalid_type_error: tr('Choose a service'),
        required_error: tr('Choose a service'),
    }),
});

export type createServices = z.infer<typeof createServiceSchema>;

export const getServiceListSchema = z.object({
    search: z.string().optional(),
    take: z.number().optional(),
});
export type getServiceList = z.infer<typeof getServiceListSchema>;
