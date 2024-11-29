import React from 'react';
import { Text } from '@taskany/bricks/harmony';

import { TabsSwitch } from '../TabsSwitch/TabsSwitch';
import { pages } from '../../hooks/useRouter';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './ProfilesManagementLayout.i18n';
import s from './ProfilesManagementLayout.module.css';

export const ProfilesManagementLayout = ({ children }: { children: React.ReactNode }) => {
    const sessionUser = useSessionUser();

    const requestsVisible =
        !!sessionUser.role?.readManyInternalUserRequests ||
        !!sessionUser.role?.readManyExternalUserRequests ||
        !!sessionUser.role?.readManyExternalFromMainUserRequests;

    return (
        <LayoutMain>
            <div className={s.Wrapper}>
                <Text weight="bold" size="xl">
                    {tr('Requests')}{' '}
                </Text>
                <div className={s.SwitchAndFilters}>
                    <TabsSwitch
                        tabsMenuOptions={[
                            {
                                title: tr('Access coordination'),
                                href: pages.accessCoordination,
                                visible: !!sessionUser.role?.decideOnUserCreationRequest || requestsVisible,
                            },
                            {
                                title: tr('Planned newcomers'),
                                href: pages.userRequests,
                                visible: !!sessionUser.role?.readManyInternalUserRequests,
                            },
                            {
                                title: tr('Scheduled deactivations'),
                                href: pages.scheduledDeactivations,
                                visible: !!sessionUser.role?.viewScheduledDeactivation,
                            },
                            {
                                title: tr('Decrees'),
                                href: pages.decreeRequests,
                                visible: !!sessionUser.role?.editUserActiveState,
                            },
                        ]}
                    />
                </div>
                {children}
            </div>
        </LayoutMain>
    );
};
