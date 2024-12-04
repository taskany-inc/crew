import { AppConfig } from '../trpc/inferredTypes';

export const getFavicon = (appConfig?: AppConfig | null): string => {
    return appConfig?.favicon ?? '/favicon.png';
};
