import React from 'react';

import { pages } from '../../hooks/useRouter';
import { TabsLayout } from '../TabsLayout';

import { tr } from './AdminPanelLayout.i18n';

interface AdminPanelLayoutProps {
    children: React.ReactNode;
}

export const AdminPanelLayout: React.FC<AdminPanelLayoutProps> = ({ children }) => (
    <TabsLayout
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
        pageTitle={tr('Admin panel')}
    >
        {children}
    </TabsLayout>
);
