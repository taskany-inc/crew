import { useState } from 'react';
import { gapS } from '@taskany/colors';
import styled from 'styled-components';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain, PageContent } from '../LayoutMain';
import { UsersPageFiltersPanel } from '../UsersPageFilterPanel/UsersPageFilterPanel';
import { CommonHeader } from '../CommonHeader';
import { UserFilterQuery } from '../../modules/userTypes';
import { UserListItem } from '../UserListItem/UserListItem';

import { tr } from './UsersPage.i18n';

const StyledUserListItemWrapper = styled.div`
    margin-bottom: ${gapS};
`;

export const UsersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersQuery, setFiltersQuery] = useState<UserFilterQuery>({ activeQuery: true });
    const usersQuery = trpc.user.getList.useQuery({ search: searchQuery, ...filtersQuery });

    return (
        <LayoutMain pageTitle={tr('Users')}>
            <CommonHeader title={tr('Users')} />
            <UsersPageFiltersPanel
                filterState={filtersQuery}
                total={usersQuery.data?.total || 0}
                counter={usersQuery.data?.counter || 0}
                setSearchQuery={setSearchQuery}
                onFilterApply={setFiltersQuery}
            />
            <PageContent>
                {usersQuery.data?.users.map((user) => (
                    <StyledUserListItemWrapper key={user.id}>
                        <UserListItem user={user} />
                    </StyledUserListItemWrapper>
                ))}
            </PageContent>
        </LayoutMain>
    );
};
