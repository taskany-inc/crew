import React from 'react';

import { pages } from '../../hooks/useRouter';
import { TabsSwitch } from '../TabsSwitch/TabsSwitch';
import { LayoutMain, PageContent } from '../LayoutMain/LayoutMain';

import { tr } from './AdminPanelLayout.i18n';

interface AdminPanelLayoutProps {
    children: React.ReactNode;
}

export const AdminPanelLayout = ({ children }: AdminPanelLayoutProps) => (
    <LayoutMain pageTitle={tr('Admin panel')}>
        <PageContent>
            <TabsSwitch
                tabsMenuOptions={[
                    {
                        title: tr('Scopes'),
                        href: pages.adminPanel,
                        visible: true,
                    },
                    {
                        title: tr('Mailing lists'),
                        href: pages.mailingLists,
                        visible: true,
                    },
                ]}
            />
            {children}
        </PageContent>
    </LayoutMain>
);
