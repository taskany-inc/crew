import React from 'react';
import { GlobalSearch, Text } from '@taskany/bricks/harmony';
import { FiltersSearchContainer } from '@taskany/bricks';

import { TabsSwitch } from '../TabsSwitch/TabsSwitch';
import { pages } from '../../hooks/useRouter';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';

import { tr } from './ProfilesManagementLayout.i18n';
import s from './ProfilesManagementLayout.module.css';

export const ProfilesManagementLayout = ({ children }: { children: React.ReactNode }) => {
    const sessionUser = useSessionUser();
    const userListFilter = useUserListFilter();
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
                                visible: !!sessionUser.role?.editUserCreationRequests || !!sessionUser.role?.createUser,
                            },
                            {
                                title: tr('Planned newcomers'),
                                href: pages.userRequests,
                                visible: !!sessionUser.role?.createUser,
                            },
                            {
                                title: tr('Scheduled deactivations'),
                                href: pages.scheduledDeactivations,
                                visible:
                                    !!sessionUser.role?.editScheduledDeactivation ||
                                    !!sessionUser.role?.viewScheduledDeactivation,
                            },
                            {
                                title: tr('To decrees'),
                                href: pages.toDecreeRequests,
                                visible: !!sessionUser.role?.editUserActiveState,
                            },
                            {
                                title: tr('From decrees'),
                                href: pages.fromDecreeRequests,
                                visible: !!sessionUser.role?.editUserActiveState,
                            },
                        ]}
                    />
                    <FiltersSearchContainer>
                        <GlobalSearch
                            placeholder={tr('Search in the table')}
                            defaultValue={userListFilter.values.search}
                            onChange={userListFilter.setSearch}
                            outline
                        />
                    </FiltersSearchContainer>
                </div>
                {children}
            </div>
        </LayoutMain>
    );
};
