import { FC, ReactNode } from 'react';
import Head from 'next/head';
import { nullable } from '@taskany/bricks/utils/nullable';
import styled from 'styled-components';

import { Theme } from '../Theme';
import { PageHeader } from '../header/PageHeader';
import { PageFooter } from '../footer/PageFooter';

import { GlobalStyle } from './GlobalStyle';

const StyledContent = styled.div`
    /* presses the footer to the bottom*/
    min-height: calc(100vh - 160px);
`;

type LayoutMainProps = {
    pageTitle?: string;
    aboveContainer?: JSX.Element;
    children?: ReactNode;
};

export const LayoutMain: FC<LayoutMainProps> = ({ pageTitle, aboveContainer, children }) => {
    const theme: 'dark' | 'light' = 'dark';

    return (
        <>
            <Head>
                <title>{pageTitle} - Taskany Crew</title>
            </Head>

            <GlobalStyle />

            <PageHeader />
            {nullable(theme, (t) => (
                <Theme theme={t} />
            ))}

            {aboveContainer}

            <StyledContent>{children}</StyledContent>
            <PageFooter />
        </>
    );
};
