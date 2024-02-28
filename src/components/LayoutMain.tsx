import { FC, ReactNode } from 'react';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import styled from 'styled-components';
import { gapL, gapM, gray4, radiusM, textColor } from '@taskany/colors';
import { Toaster } from 'react-hot-toast';

import { trpc } from '../trpc/trpcClient';

import { Theme } from './Theme';
import { PageHeader } from './PageHeader/PageHeader';
import { PageFooter } from './PageFooter/PageFooter';
import { GlobalStyle } from './GlobalStyle';
import { OfflineBanner } from './OfflineBanner/OfflineBanner';

const StyledContent = styled.div`
    /* presses the footer to the bottom*/
    min-height: calc(100vh - 160px);
`;

export const PageContent = styled.div`
    padding: ${gapM} ${gapL} ${gapL} ${gapL};
`;

interface LayoutMainProps {
    pageTitle?: string | null;
    children?: ReactNode;
}

export const LayoutMain: FC<LayoutMainProps> = ({ pageTitle, children }) => {
    const fullTitle = pageTitle ? `${pageTitle} - Taskany Crew` : 'Taskany Crew';

    const userSettings = trpc.user.getSettings.useQuery();
    const appConfig = trpc.appConfig.get.useQuery(undefined, {
        staleTime: Infinity,
    });

    const { resolvedTheme } = useTheme();
    const theme = (
        userSettings.data?.theme === 'system' ? resolvedTheme || 'dark' : userSettings.data?.theme || 'light'
    ) as 'dark' | 'light';

    return (
        <>
            <Head>
                <title>{fullTitle}</title>
                <link rel="icon" href={appConfig.data?.favicon ?? '/favicon.png'} />
                <link rel="stylesheet" id="themeVariables" href={`/theme/${theme}.css`} />
            </Head>
            <OfflineBanner />

            <GlobalStyle />
            <PageHeader logo={appConfig.data?.logo ?? undefined} />
            <Theme theme={theme} />
            <StyledContent>{children}</StyledContent>

            <Toaster
                toastOptions={{
                    style: { borderRadius: radiusM, background: gray4, color: textColor },
                }}
                position="bottom-right"
            />

            <PageFooter />
        </>
    );
};
