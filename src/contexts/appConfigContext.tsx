import { FC, PropsWithChildren, createContext, useContext } from 'react';

import { trpc } from '../trpc/trpcClient';
import { AppConfig } from '../trpc/inferredTypes';

const appConfigContext = createContext<AppConfig>(null);

export const AppConfigContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const appConfig = trpc.appConfig.get.useQuery(undefined, {
        staleTime: Infinity,
    });

    return <appConfigContext.Provider value={appConfig.data || null}>{children}</appConfigContext.Provider>;
};

export const useAppConfig = () => useContext(appConfigContext);
