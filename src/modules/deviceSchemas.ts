import { z } from 'zod';

import { tr } from './modules.i18n';

export const createDeviceSchema = z.object({
    userId: z.string(),
    deviceId: z
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
    deviceName: z.string({
        invalid_type_error: tr('Choose a device'),
        required_error: tr('Choose a device'),
    }),
});

export type CreateDevice = z.infer<typeof createDeviceSchema>;

export const getDeviceListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetDeviceList = z.infer<typeof getDeviceListSchema>;
