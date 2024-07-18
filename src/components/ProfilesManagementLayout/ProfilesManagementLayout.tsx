import React, { ReactNode } from 'react';

import { TabsLayout } from '../TabsLayout';
import { pages } from '../../hooks/useRouter';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './ProfilesManagementLayout.i18n';

interface ProfilesManagementLayoutProps {
    children: ReactNode;
}

export const ProfilesManagementLayout = ({ children }: ProfilesManagementLayoutProps) => {
    const sessionUser = useSessionUser();
    return (
        <TabsLayout
            tabsMenuOptions={[
                {
                    title: tr('New profile requests'),
                    href: pages.userRequests,
                    visible: !!sessionUser.role?.editUserCreationRequests,
                },
                {
                    title: tr('Scheduled deactivations'),
                    href: pages.scheduledDeactivations,
                    visible:
                        !!sessionUser.role?.editScheduledDeactivation || !!sessionUser.role?.viewScheduledDeactivation,
                },
                {
                    title: tr('Planned newcomers'),
                    href: pages.userRequestList,
                    visible: !!sessionUser.role?.editUserCreationRequests,
                },
            ]}
            pageTitle={tr('Profiles management')}
        >
            {children}
        </TabsLayout>
    );
};
