import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import '@taskany/bricks/harmony/style.css';
import { PageLoadProgress } from '@taskany/bricks';
import { SessionProvider } from 'next-auth/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { usePageLoad } from '../hooks/usePageLoad';
import { TLocale, setSSRLocale } from '../utils/getLang';
import { trpc } from '../trpc/trpcClient';
import { PreviewContextProvider } from '../contexts/previewContext';
import { Previews } from '../components/Previews';

const TaskanyCrewApp = ({ Component, pageProps, router }: AppProps) => {
    setSSRLocale(router.locale as TLocale);

    const pageLoadRef = usePageLoad(router);

    return (
        <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
            <ThemeProvider themes={['light', 'dark']}>
                <PreviewContextProvider>
                    <PageLoadProgress height={2} ref={pageLoadRef} />
                    <Component {...pageProps} />
                    <Previews />
                    <ReactQueryDevtools />
                </PreviewContextProvider>
            </ThemeProvider>
        </SessionProvider>
    );
};

export default trpc.withTRPC(TaskanyCrewApp);
