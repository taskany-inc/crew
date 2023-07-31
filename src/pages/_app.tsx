import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { PageLoadProgress } from '@taskany/bricks';
import { SessionProvider } from 'next-auth/react';

import { usePageLoad } from '../hooks/usePageLoad';
import { TLocale, setSSRLocale } from '../utils/getLang';
import { trpc } from '../trpc/trpcClient';

const queryClient = new QueryClient();

const TaskanyCrewApp = ({ Component, pageProps, router }: AppProps) => {
    setSSRLocale(router.locale as TLocale);

    const pageLoadRef = usePageLoad(router);

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>
            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <ThemeProvider themes={['light', 'dark']}>
                    <PageLoadProgress height={2} ref={pageLoadRef} />
                    <QueryClientProvider client={queryClient}>
                        <Component {...pageProps} />
                    </QueryClientProvider>
                </ThemeProvider>
            </SessionProvider>
        </>
    );
};

export default trpc.withTRPC(TaskanyCrewApp);
