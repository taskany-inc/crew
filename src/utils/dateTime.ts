import { SupplementalPosition } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { TLocale } from './getLang';

const formattersDTF: Record<TLocale, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }),
    ru: new Intl.DateTimeFormat('ru', { dateStyle: 'medium' }),
};

const formattersRTF: Record<TLocale, Intl.RelativeTimeFormat> = {
    en: new Intl.RelativeTimeFormat('en', { style: 'long', numeric: 'auto' }),
    ru: new Intl.RelativeTimeFormat('ru', { style: 'long', numeric: 'auto' }),
};

export const formatDate = (date: Date, locale: TLocale): string => {
    return formattersDTF[locale].format(date);
};

const divisions: Array<{ amount: number; name: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' },
];

export const dateAgo = (pastDate: Date, locale: TLocale): string | undefined => {
    const formatter = formattersRTF[locale];

    let duration = (Number(pastDate) - Date.now()) / 1000;

    for (let i = 0; i <= divisions.length; i++) {
        const division = divisions[i];
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }
};

export const stripTimezone = (d?: string) => d?.split('T')[0];
export const minuteInMiliSeconds = 60000;

const guard = <V extends SupplementalPosition, K extends string>(
    val: Partial<V>,
    key: K,
): key is Extract<K, keyof V> => {
    return Reflect.has(val, key);
};

export const supplementalPositionsDate = (
    supplementalPositions: Partial<SupplementalPosition>[],
    dateType: 'workEndDate' | 'workStartDate',
) => {
    let foundedDate: Date | null | undefined = null;

    for (const pos of supplementalPositions) {
        if (guard(pos, dateType)) {
            if (!foundedDate && pos[dateType]) foundedDate = pos[dateType];
            const currDate = pos[dateType];

            if (currDate == null) {
                // eslint-disable-next-line no-continue
                continue;
            }

            if (foundedDate && currDate && dateType === 'workEndDate') {
                foundedDate = foundedDate > currDate ? foundedDate : currDate;
            }

            if (foundedDate && currDate && dateType === 'workStartDate') {
                foundedDate = foundedDate < currDate ? foundedDate : currDate;
            }
        }
    }

    if (!foundedDate) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date specified' });

    return foundedDate;
};

export const isSameDay = (date1: Date, date2: Date) => {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
};

export const isPast = (date: Date) => {
    return new Date().getTime() - date.getTime() > 0;
};

export const isFuture = (date: Date) => {
    return new Date().getTime() - date.getTime() < 0;
};
