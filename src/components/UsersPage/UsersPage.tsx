import { useState } from 'react';
import { gapS } from '@taskany/colors';
import { Button, Text } from '@taskany/bricks';
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
    const usersQuery = trpc.user.getList.useInfiniteQuery(
        { search: searchQuery, ...filtersQuery },
        {
            keepPreviousData: true,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
    );

    return (
        <LayoutMain pageTitle={tr('Users')}>
            <CommonHeader title={tr('Users')} />
            <UsersPageFiltersPanel
                filterState={filtersQuery}
                total={usersQuery.data?.pages[0].total || 0}
                counter={usersQuery.data?.pages[0].counter || 0}
                setSearchQuery={setSearchQuery}
                onFilterApply={setFiltersQuery}
            />
            <PageContent>
                {usersQuery.data?.pages.map((page, index) => (
                    <div key={`page-${index}`}>
                        {page.total === 0 ? (
                            <Text>{tr('Nothing found')} 😔</Text>
                        ) : (
                            page.users?.map((user) => (
                                <StyledUserListItemWrapper key={user.id}>
                                    <UserListItem user={user} />
                                </StyledUserListItemWrapper>
                            ))
                        )}
                    </div>
                ))}
                {usersQuery.hasNextPage && (
                    <Button type="button" text={tr('Load more users')} onClick={() => usersQuery.fetchNextPage()} />
                )}
                <div>{usersQuery.isFetching && <Text>{tr('Loading users')} ⏳</Text>}</div>
            </PageContent>
        </LayoutMain>
    );
};
