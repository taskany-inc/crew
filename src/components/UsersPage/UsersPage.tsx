import { gapS } from '@taskany/colors';
import { Button, Text } from '@taskany/bricks';
import styled from 'styled-components';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain, PageContent } from '../LayoutMain/LayoutMain';
import { UsersPageFiltersPanel } from '../UsersPageFilterPanel/UsersPageFilterPanel';
import { CommonHeader } from '../CommonHeader';
import { UserListItem } from '../UserListItem/UserListItem';
import { useUserListFilter } from '../../hooks/useUserListFilter';

import { tr } from './UsersPage.i18n';

const StyledUserListItemWrapper = styled.div`
    margin-bottom: ${gapS};
`;

export const UsersPage = () => {
    const userListFilter = useUserListFilter();

    const usersQuery = trpc.user.getList.useInfiniteQuery(
        {
            ...userListFilter.values,
            active:
                userListFilter.values.activity === undefined ? undefined : userListFilter.values.activity === 'active',
        },
        {
            keepPreviousData: true,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
    );

    return (
        <LayoutMain pageTitle={tr('Users')}>
            <CommonHeader title={tr('Users')} />
            <UsersPageFiltersPanel
                loading={usersQuery.isLoading}
                total={usersQuery.data?.pages[0].total || 0}
                counter={usersQuery.data?.pages[0].counter || 0}
            />
            <PageContent>
                {usersQuery.data?.pages.map((page, index) => (
                    <div key={`page-${index}`}>
                        {page.counter === 0 ? (
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
