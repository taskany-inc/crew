import { useRouter } from 'next/router';

import { TLocale, defaultLocale } from '../utils/getLang';

export const useLocale = () => {
    const router = useRouter();

    return (router.locale ?? defaultLocale) as TLocale;
};
