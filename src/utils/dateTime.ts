import { TLocale } from './getLang';

const formatters: Record<TLocale, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }),
    ru: new Intl.DateTimeFormat('ru', { dateStyle: 'medium' }),
};

export const formatDate = (date: Date, locale: TLocale): string => {
    return formatters[locale].format(date);
};
