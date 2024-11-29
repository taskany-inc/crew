import { ReactNode, memo } from 'react';
import { FiltersPanelContainer, FiltersPanelContent } from '@taskany/bricks';

import { SearchFilter } from '../SearchFilter';
import { useUserListFilter } from '../../hooks/useUserListFilter';

import { tr } from './ProfilesManagementSearch.i18n';

interface UsersPageFilterPanelProps {
    children?: ReactNode;
    loading?: boolean;
}

export const ProfilesManagementSearch = memo(({ loading }: UsersPageFilterPanelProps) => {
    const userListFilter = useUserListFilter();

    return (
        <>
            <FiltersPanelContainer loading={loading}>
                <FiltersPanelContent>
                    <SearchFilter
                        placeholder={tr('Search')}
                        defaultValue={userListFilter.values.search}
                        onChange={userListFilter.setSearch}
                    />
                </FiltersPanelContent>
            </FiltersPanelContainer>
        </>
    );
});
