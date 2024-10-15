import { FC, ReactNode, useEffect } from 'react';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import { gapL, gapM, gray4, radiusM, textColor } from '@taskany/colors';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { trpc } from '../../trpc/trpcClient';
import { getFavicon } from '../../utils/getFavicon';
import { Theme } from '../Theme';
import { PageHeader } from '../PageHeader/PageHeader';
import { PageFooter } from '../PageFooter/PageFooter';
import { OfflineBanner } from '../OfflineBanner/OfflineBanner';

import s from './LayoutMain.module.css';

export const PageContent = styled.div`
    padding: ${gapM} ${gapL} ${gapL} ${gapL};
`;

interface LayoutMainProps {
    pageTitle?: string | null;
    children?: ReactNode;
}

export const LayoutMain: FC<LayoutMainProps> = ({ pageTitle, children }) => {
    const fullTitle = pageTitle ? `${pageTitle} - Taskany Crew` : 'Taskany Crew';

    const { data: userSettings } = trpc.user.getSettings.useQuery();
    const appConfig = trpc.appConfig.get.useQuery(undefined, {
        staleTime: Infinity,
    });

    const { resolvedTheme } = useTheme();
    const theme = (userSettings?.theme === 'system' ? resolvedTheme || 'dark' : userSettings?.theme || 'light') as
        | 'dark'
        | 'light';

    const router = useRouter();

    useEffect(() => {
        const { asPath, locale, replace } = router;

        if (userSettings?.locale && locale !== userSettings.locale) {
            replace(asPath, asPath, { locale: userSettings.locale });
        }
    }, [router, userSettings]);

    return (
        <>
            <Head>
                <title>{fullTitle}</title>
                <link rel="icon" href={getFavicon(appConfig.data)} />
                <link rel="stylesheet" id="themeVariables" href={`/theme/${theme}.css`} />
            </Head>
            <OfflineBanner />

            <PageHeader logo={appConfig.data?.logo ?? undefined} userSettings={userSettings} />
            <Theme theme={theme} />
            <div className={s.PageMain}>{children}</div>

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
