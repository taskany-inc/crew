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

import { tr } from './UsersPageFilterPanel.i18n';

type UserFilterQueryUrlParam = Omit<UserFilterQuery, 'active'> & { active?: 'true' | 'false' };
interface UsersPageFilterPanelProps {
    setSearchQuery: (searchQuery: string) => void;
    filterState: UserFilterQuery;
    searchQuery?: string;
    children?: ReactNode;
    loading?: boolean;
    total: number;
    counter: number;
    onFilterApply?: (filterQuery: UserFilterQuery) => void;
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

export const UsersPageFiltersPanel = memo(
    ({
        children,
        loading,
        total,
        counter,
        onFilterApply,
        setSearchQuery,
        filterState,
        searchQuery,
    }: UsersPageFilterPanelProps) => {
        const filterNodeRef = useRef<HTMLSpanElement>(null);
        const [supervisorsQuery, setSupervisorQuery] = useState('');
        const [groupsQuery, setGroupQuery] = useState('');
        const [rolesQuery, setRoleQuery] = useState('');
        const [filterVisible, setFilterVisible] = useState(false);

        const [filterQuery, setFilterQuery] = useState<UserFilterQuery>(filterState);

        const activeVariants = { Active: 'true', Inactive: 'false', All: undefined } as const;

        const [filterActive, setFilterActive] = useState(() => {
            if (filterState.active === undefined) return 'All';

            return filterState.active ? 'Active' : 'Inactive';
        });

        const onApplyClick = useCallback(() => {
            setFilterVisible(false);
            setRoleQuery('');
            setGroupQuery('');
            setSupervisorQuery('');

            if (filterQuery.roles && !filterQuery.roles.length) filterQuery.roles = undefined;

            if (filterQuery.groups && !filterQuery.groups.length) filterQuery.groups = undefined;

            if (filterQuery.supervisors && !filterQuery.supervisors.length) {
                filterQuery.supervisors = undefined;
            }
            onFilterApply && onFilterApply(filterQuery);
        }, [filterQuery, onFilterApply]);

        const { data: supervisors } = trpc.user.suggestions.useQuery(
            { query: supervisorsQuery, take: suggestionsTake, include: filterState.supervisors },
            useQueryOptions,
        );

        const { data: groups = [] } = trpc.group.suggestions.useQuery(
            { query: groupsQuery, take: suggestionsTake, include: filterState.groups },
            useQueryOptions,
        );

        const { data: roles = [] } = trpc.role.suggestions.useQuery(
            { query: rolesQuery, take: suggestionsTake, include: filterState.roles },
            useQueryOptions,
        );

        const setPartialQueryByKey = useCallback(<K extends keyof UserFilterQueryUrlParam>(key: K) => {
            return (value: UserFilterQueryUrlParam[K]) => {
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
            setSearchQuery('');
            setSupervisorQuery('');
            onFilterApply &&
                onFilterApply({
                    active: undefined,
                    groups: undefined,
                    roles: undefined,
                    supervisors: undefined,
                });
        };

        const isFiltersEmpty = !filterQuery.groups && !filterQuery.roles && !filterQuery.supervisors;

        return (
            <>
                <FiltersPanelContainer loading={loading}>
                    <FiltersPanelContent>
                        <FiltersSearchContainer>
                            <SearchFilter
                                placeholder={tr('Search')}
                                defaultValue={searchQuery}
                                onChange={setSearchQuery}
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
                        value={filterQuery?.supervisors}
                        onChange={setPartialQueryByKey('supervisors')}
                        onSearchChange={setSupervisorQuery}
                    />
                    <GroupsOrRolesFilter
                        tabName="groups"
                        text={tr('Teams')}
                        filterCheckboxName="group"
                        groupsOrRoles={groups.map(({ id, name }) => ({ id, name }))}
                        value={filterQuery?.groups}
                        onChange={setPartialQueryByKey('groups')}
                        onSearchChange={setGroupQuery}
                    />
                    <GroupsOrRolesFilter
                        tabName="roles"
                        text={tr('Roles')}
                        filterCheckboxName="role"
                        groupsOrRoles={roles.map(({ id, name }) => ({ id, name }))}
                        value={filterQuery?.roles}
                        onChange={setPartialQueryByKey('roles')}
                        onSearchChange={setRoleQuery}
                    />

                    <FilterRadio
                        tabName="active"
                        label={tr('Active')}
                        items={Object.keys(activeVariants).map((v) => ({ title: v, value: v }))}
                        value={filterActive}
                        onChange={(arg) => {
                            setFilterActive(arg);
                            setPartialQueryByKey('active')(activeVariants[arg as keyof typeof activeVariants]);
                        }}
                    />
                </FilterPopup>
            </>
        );
    },
);
