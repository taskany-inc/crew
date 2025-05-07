import React, { useCallback, useMemo, useState } from 'react';
import { Text } from '@taskany/bricks/harmony';
import { IconSearchOutline } from '@taskany/icons';
import { Button, nullable } from '@taskany/bricks';

import { TabsSwitch } from '../TabsSwitch/TabsSwitch';
import { pages } from '../../hooks/useRouter';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { SearchFilter } from '../SearchFilter';
import { AddFilterDropdown } from '../AddFilterDropdown/AddFilterDropdown';
import { useRequestFilters } from '../../hooks/useRequestFilters';
import { AppliedUserFilter } from '../AppliedUserFilter/AppliedUserFilter';
import { AppliedGroupFilter } from '../AppliedGroupFilter/AppliedGroupFilter';
import { AppliedOrganizationFilter } from '../AppliedOrganizationFilter/AppliedOrganizationFilter';
import { AppliedStatusFilter } from '../AppliedStatusFilter/AppliedStatusFilter';
import { AppliedDateFilter } from '../AppliedDateFilter/AppliedDateFilter';

import s from './ProfilesManagementLayout.module.css';
import { tr } from './ProfilesManagementLayout.i18n';

export const ProfilesManagementLayout = ({ children }: { children: React.ReactNode }) => {
    const sessionUser = useSessionUser();
    const userListFilter = useUserListFilter();

    const { currentValues, setter, clearParams, filterValues } = useRequestFilters();
    const [filtersState, setFiltersState] = useState(currentValues);

    const restFilterItems = useMemo(() => {
        return filterValues.filter((item) => !filtersState?.[item.id as keyof typeof filtersState]);
    }, [filterValues, filtersState]);

    const setPartialQueryByKey = useCallback((key: keyof typeof currentValues) => {
        return (value?: string[]) => {
            setFiltersState((prev) => {
                return {
                    ...prev,
                    [key]: value,
                };
            });
        };
    }, []);

    const handleChange = useCallback(
        (key: keyof typeof currentValues) => (values?: { id: string }[]) => {
            setPartialQueryByKey(key)(values?.map(({ id }) => id));
        },
        [setPartialQueryByKey],
    );

    const handleDateChange = useCallback(
        (key: keyof typeof currentValues) => (date: string[]) => setPartialQueryByKey(key)(date),
        [setPartialQueryByKey],
    );

    const onApply = useCallback(() => {
        Object.keys(currentValues).forEach((key) => {
            setter(key as keyof typeof currentValues, filtersState?.[key as keyof typeof filtersState]);
        });
    }, [setter, currentValues, filtersState]);

    const onCleanFilter = useCallback(
        (key: keyof typeof currentValues) => () => {
            setPartialQueryByKey(key)(undefined);
            setter(key, undefined);
        },
        [setPartialQueryByKey, setter],
    );

    const onResetFilters = () => {
        clearParams();
        setFiltersState({});
    };

    const isFiltersEmpty = filterValues.length === restFilterItems.length;

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
                                title: tr('To decrees'),
                                href: pages.toDecreeRequests,
                                visible: !!sessionUser.role?.editUserActiveState,
                            },
                            {
                                title: tr('From decrees'),
                                href: pages.fromDecreeRequests,
                                visible: !!sessionUser.role?.editUserActiveState,
                            },
                            {
                                title: tr('Scheduled deactivations'),
                                href: pages.scheduledDeactivations,
                                visible: !!sessionUser.role?.viewScheduledDeactivation,
                            },
                        ]}
                    />
                    <div className={s.FilterActions}>
                        {nullable(
                            isFiltersEmpty,
                            () => (
                                <AddFilterDropdown
                                    title={tr('Filters')}
                                    items={restFilterItems}
                                    onChange={([item]) =>
                                        setPartialQueryByKey(item.id as keyof typeof currentValues)([])
                                    }
                                />
                            ),
                            <Button text={tr('Reset filters')} onClick={onResetFilters} />,
                        )}
                        <SearchFilter
                            iconLeft={<IconSearchOutline size="s" />}
                            placeholder={tr('Search in the table')}
                            defaultValue={userListFilter.values.search}
                            onChange={userListFilter.setSearch}
                            className={s.Search}
                        />
                    </div>
                </div>
                {nullable(!isFiltersEmpty, () => (
                    <div className={s.LayoutWrapperFilters}>
                        {nullable(Boolean(filtersState?.status), () => (
                            <AppliedStatusFilter
                                label={tr('Status')}
                                selectedStatuses={filtersState?.status}
                                onChange={handleChange('status')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('status')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.organization), () => (
                            <AppliedOrganizationFilter
                                label={tr('Organization')}
                                selectedOrganizations={filtersState?.organization}
                                onChange={handleChange('organization')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('organization')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.team), () => (
                            <AppliedGroupFilter
                                label={tr('Team')}
                                selectedGroups={filtersState?.team}
                                onChange={handleChange('team')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('team')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.manager), () => (
                            <AppliedUserFilter
                                label={tr('Manager')}
                                selectedUsers={filtersState?.manager}
                                onChange={handleChange('manager')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('manager')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.author), () => (
                            <AppliedUserFilter
                                label={tr('Author')}
                                selectedUsers={filtersState?.author}
                                onChange={handleChange('author')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('author')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.dateFrom), () => (
                            <AppliedDateFilter
                                label={tr('From')}
                                selectedDate={filtersState?.dateFrom}
                                onChange={handleDateChange('dateFrom')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('dateFrom')}
                            />
                        ))}
                        {nullable(Boolean(filtersState?.dateTo), () => (
                            <AppliedDateFilter
                                label={tr('To')}
                                selectedDate={filtersState?.dateTo}
                                onChange={handleDateChange('dateTo')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('dateTo')}
                            />
                        ))}
                        <AddFilterDropdown
                            title={tr('Filters')}
                            items={restFilterItems}
                            onChange={([item]) => setPartialQueryByKey(item.id as keyof typeof currentValues)([])}
                        />
                    </div>
                ))}
                {children}
            </div>
        </LayoutMain>
    );
};
