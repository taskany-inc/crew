import { z } from 'zod';
import parsePhoneNumber from 'libphonenumber-js';

import { tr } from './utils.i18n';

export const getPhoneSchema = () =>
    z
        .string({ required_error: tr('Enter phone number in format +7(900)123-45-67') })
        .refine((e) => parsePhoneNumber(e, 'RU')?.isValid(), tr('Enter phone number in format +7(900)123-45-67'))
        .transform((e) => String(parsePhoneNumber(e, 'RU')?.number));
