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
