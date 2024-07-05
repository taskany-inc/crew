import { AppConfig } from 'prisma/prisma-client';

export const getFavicon = (appConfig?: AppConfig | null): string => {
    return appConfig?.favicon ?? '/favicon.png';
};
