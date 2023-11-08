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

import { tr } from './UsersPageFiltersPanel.i18n';

type UsersPageFilterPanelProps = {
    setSearchQuery: (searchQuery: string) => void;
    filterState: UserFilterQuery;
    children?: ReactNode;
    loading?: boolean;
    total: number;
    counter: number;
    onFilterApply?: (filterQuery: UserFilterQuery) => void;
};

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

export const UsersPageFiltersPanel = memo(
    ({ children, loading, total, counter, onFilterApply, setSearchQuery, filterState }: UsersPageFilterPanelProps) => {
        const filterNodeRef = useRef<HTMLSpanElement>(null);
        const [supervisorsQuery, setSupervisorQuery] = useState('');
        const [groupsQuery, setGroupQuery] = useState('');
        const [rolesQuery, setRoleQuery] = useState('');
        const [filterVisible, setFilterVisible] = useState(false);
        const [filterQuery, setFilterQuery] = useState<UserFilterQuery>(filterState);

        const onApplyClick = useCallback(() => {
            setFilterVisible(false);
            setRoleQuery('');
            setGroupQuery('');
            setSupervisorQuery('');

            if (filterQuery.rolesQuery && !filterQuery.rolesQuery.length) filterQuery.rolesQuery = undefined;

            if (filterQuery.groupsQuery && !filterQuery.groupsQuery.length) filterQuery.groupsQuery = undefined;

            if (filterQuery.supervisorsQuery && !filterQuery.supervisorsQuery.length) {
                filterQuery.supervisorsQuery = undefined;
            }
            onFilterApply && onFilterApply(filterQuery);
        }, [filterQuery, onFilterApply]);

        const { data: supervisors } = trpc.user.suggestions.useQuery(
            { query: supervisorsQuery, take: suggestionsTake, include: filterState.supervisorsQuery },
            useQueryOptions,
        );

        const { data: groups = [] } = trpc.group.suggestions.useQuery(
            { query: groupsQuery, take: suggestionsTake, include: filterState.groupsQuery },
            useQueryOptions,
        );

        const { data: roles = [] } = trpc.role.suggestions.useQuery(
            { query: rolesQuery, take: suggestionsTake, include: filterState.rolesQuery },
            useQueryOptions,
        );

        const setPartialQueryByKey = useCallback(<K extends keyof UserFilterQuery>(key: K) => {
            return (value: UserFilterQuery[K]) => {
                setFilterQuery((prev) => {
                    return {
                        ...prev,
                        [key]: value,
                    };
                });
            };
        }, []);

        const onResetClick = () => {
            setFilterQuery({});
            setRoleQuery('');
            setGroupQuery('');
            setSupervisorQuery('');
            onFilterApply && onFilterApply({});
        };

        const isFiltersEmpty = !filterQuery.groupsQuery && !filterQuery.rolesQuery && !filterQuery.supervisorsQuery;

        return (
            <>
                <FiltersPanelContainer loading={loading}>
                    <FiltersPanelContent>
                        <FiltersSearchContainer>
                            <SearchFilter placeholder={tr('Search')} onChange={setSearchQuery} />
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
                    filterState={filterState}
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
                        value={filterQuery?.supervisorsQuery}
                        onChange={setPartialQueryByKey('supervisorsQuery')}
                        onSearchChange={setSupervisorQuery}
                    />
                    <GroupsOrRolesFilter
                        tabName="groups"
                        text={tr('Teams')}
                        filterCheckboxName="group"
                        groupsOrRoles={groups.map(({ id, name }) => ({ id, name }))}
                        value={filterQuery?.groupsQuery}
                        onChange={setPartialQueryByKey('groupsQuery')}
                        onSearchChange={setGroupQuery}
                    />
                    <GroupsOrRolesFilter
                        tabName="roles"
                        text={tr('Roles')}
                        filterCheckboxName="role"
                        groupsOrRoles={roles.map(({ id, name }) => ({ id, name }))}
                        value={filterQuery?.rolesQuery}
                        onChange={setPartialQueryByKey('rolesQuery')}
                        onSearchChange={setRoleQuery}
                    />
                </FilterPopup>
            </>
        );
    },
);
