import React from 'react';
import { useRouter } from 'next/router';
import { TabsMenu, TabsMenuItem } from '@taskany/bricks';

import { LayoutMain, PageContent } from './LayoutMain/LayoutMain';
import { Link } from './Link';

interface TabsMenuOptions {
    title: string;
    href: string;
    visible?: boolean;
}

interface TabsLayoutProps {
    children: React.ReactNode;
    tabsMenuOptions: Array<TabsMenuOptions>;
    pageTitle: string;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children, tabsMenuOptions, pageTitle }) => {
    const router = useRouter();

    return (
        <LayoutMain pageTitle={pageTitle}>
            <PageContent>
                <TabsMenu>
                    {tabsMenuOptions
                        .filter(({ visible }) => visible)
                        .map(({ title, href }) => (
                            <Link key={href} href={href}>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </Link>
                        ))}
                </TabsMenu>
                {children}
            </PageContent>
        </LayoutMain>
    );
};
