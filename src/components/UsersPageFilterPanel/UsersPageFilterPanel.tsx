import { ReactNode, memo, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import {
    FiltersCounter,
    FiltersCounterContainer,
    FiltersPanelContainer,
    FiltersPanelContent,
    FiltersSearchContainer,
    FiltersMenuContainer,
    FiltersMenuItem,
    FilterPopup,
    Button,
} from '@taskany/bricks';
import { User } from 'prisma/prisma-client';

import { SearchFilter } from '../SearchFilter';
import { UserFilterApplied } from '../UserFilterApplied/UserFilterApplied';
import { suggestionsTake } from '../../utils/suggestions';
import { UserFilter } from '../UserFilter/UserFilter';
import { trpc } from '../../trpc/trpcClient';
import { GroupsOrRolesFilter } from '../GroupsOrRolesFilter/GroupsOrRolesFilter';
import { UserFilterQuery } from '../../modules/userTypes';
import { FilterRadio } from '../FilterRadio';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { objKeys } from '../../utils/objKeys';

import { tr } from './UsersPageFilterPanel.i18n';

interface UsersPageFilterPanelProps {
    children?: ReactNode;
    loading?: boolean;
    total: number;
    counter: number;
}

const StyledFiltersMenuContainer = styled(FiltersMenuContainer)`
    display: flex;
    align-items: center;
`;

const StyledResetButton = styled(Button)`
    margin-left: auto;
`;

const mapUserToView = (users: User[]) => users.map(({ id, email, name }) => ({ id, email, name }));

const useQueryOptions = {
    keepPreviousData: true,
};

type ActivityVariants = 'active' | 'inactive' | 'all';

const activityValues: Record<ActivityVariants, string | undefined> = {
    active: 'true',
    inactive: 'false',
    all: undefined,
};

export const UsersPageFiltersPanel = memo(({ children, loading, total, counter }: UsersPageFilterPanelProps) => {
    const userListFilter = useUserListFilter();

    const filterNodeRef = useRef<HTMLSpanElement>(null);
    const [supervisorsQuery, setSupervisorQuery] = useState('');
    const [groupsQuery, setGroupQuery] = useState('');
    const [rolesQuery, setRoleQuery] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);

    const [localFilterQuery, setLocalFilterQuery] = useState<UserFilterQuery>(userListFilter.values);

    const activityTranslations: Record<ActivityVariants, string> = {
        active: tr('Active'),
        inactive: tr('Inactive'),
        all: tr('All'),
    };

    const onApplyClick = () => {
        setFilterVisible(false);
        setRoleQuery('');
        setGroupQuery('');
        setSupervisorQuery('');

        if (localFilterQuery.roles && !localFilterQuery.roles.length) localFilterQuery.roles = undefined;

        if (localFilterQuery.groups && !localFilterQuery.groups.length) localFilterQuery.groups = undefined;

        if (localFilterQuery.supervisors && !localFilterQuery.supervisors.length) {
            localFilterQuery.supervisors = undefined;
        }
        userListFilter.setFiltersQuery(localFilterQuery);
    };

    const { data: supervisors } = trpc.user.suggestions.useQuery(
        { query: supervisorsQuery, take: suggestionsTake, include: userListFilter.values.supervisors },
        useQueryOptions,
    );

    const { data: groups = [] } = trpc.group.suggestions.useQuery(
        { query: groupsQuery, take: suggestionsTake, include: userListFilter.values.groups },
        useQueryOptions,
    );

    const { data: roles = [] } = trpc.role.suggestions.useQuery(
        { query: rolesQuery, take: suggestionsTake, include: userListFilter.values.roles },
        useQueryOptions,
    );

    const setPartialQueryByKey = useCallback(<K extends keyof UserFilterQuery>(key: K) => {
        return (value: UserFilterQuery[K]) => {
            setLocalFilterQuery((prev) => {
                return {
                    ...prev,
                    [key]: value,
                };
            });
        };
    }, []);

    const onResetClick = () => {
        setLocalFilterQuery({});
        setRoleQuery('');
        setGroupQuery('');
        setSupervisorQuery('');
        userListFilter.setSearch('');
        userListFilter.setFiltersQuery({
            activity: undefined,
            groups: undefined,
            roles: undefined,
            supervisors: undefined,
        });
    };

    const isFiltersEmpty = !localFilterQuery.groups && !localFilterQuery.roles && !localFilterQuery.supervisors;

    return (
        <>
            <FiltersPanelContainer loading={loading}>
                <FiltersPanelContent>
                    <FiltersSearchContainer>
                        <SearchFilter
                            placeholder={tr('Search')}
                            defaultValue={userListFilter.values.search}
                            onChange={userListFilter.setSearch}
                        />
                    </FiltersSearchContainer>
                    <FiltersCounterContainer>
                        <FiltersCounter total={total} counter={counter} />
                    </FiltersCounterContainer>
                    <StyledFiltersMenuContainer>
                        <FiltersMenuItem
                            ref={filterNodeRef}
                            active={!isFiltersEmpty}
                            onClick={() => setFilterVisible((p) => !p)}
                        >
                            {tr('Filter')}
                        </FiltersMenuItem>

                        {children}
                    </StyledFiltersMenuContainer>
                    <StyledResetButton text="Reset" onClick={onResetClick} />
                </FiltersPanelContent>
            </FiltersPanelContainer>
            <UserFilterApplied
                filterState={userListFilter.values}
                supervisors={supervisors}
                groups={groups}
                roles={roles}
            ></UserFilterApplied>
            <FilterPopup
                applyButtonText={tr('Apply')}
                cancelButtonText={tr('Cancel')}
                visible={filterVisible}
                onApplyClick={onApplyClick}
                filterRef={filterNodeRef}
                switchVisible={setFilterVisible}
                activeTab="state"
            >
                <UserFilter
                    tabName="supervisor"
                    text={tr('Supervisors')}
                    users={mapUserToView(supervisors || [])}
                    value={localFilterQuery?.supervisors}
                    onChange={setPartialQueryByKey('supervisors')}
                    onSearchChange={setSupervisorQuery}
                />
                <GroupsOrRolesFilter
                    tabName="groups"
                    text={tr('Teams')}
                    filterCheckboxName="group"
                    groupsOrRoles={groups.map(({ id, name }) => ({ id, name }))}
                    value={localFilterQuery?.groups}
                    onChange={setPartialQueryByKey('groups')}
                    onSearchChange={setGroupQuery}
                />
                <GroupsOrRolesFilter
                    tabName="roles"
                    text={tr('Roles')}
                    filterCheckboxName="role"
                    groupsOrRoles={roles.map(({ id, name }) => ({ id, name }))}
                    value={localFilterQuery?.roles}
                    onChange={setPartialQueryByKey('roles')}
                    onSearchChange={setRoleQuery}
                />

                <FilterRadio
                    tabName="activity"
                    label={tr('Activity')}
                    items={objKeys(activityValues).map((k) => ({ title: activityTranslations[k], value: k }))}
                    value={localFilterQuery.activity || 'all'}
                    onChange={(arg) => {
                        setPartialQueryByKey('activity')(
                            arg === 'all' ? undefined : (arg as UserFilterQuery['activity']),
                        );
                    }}
                />
            </FilterPopup>
        </>
    );
});
