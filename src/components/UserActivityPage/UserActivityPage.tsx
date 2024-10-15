import { Tab, TabContent, Tabs, TabsMenu, nullable, Text } from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';
import styled from 'styled-components';
import { gapS, gapL, gray9 } from '@taskany/colors';

import { CommonHeader } from '../CommonHeader';
import { TrpcRouterOutput, trpc } from '../../trpc/trpcClient';
import { HistoryRecord } from '../HistoryRecord/HistoryRecord';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { HistoryEventData } from '../../modules/historyEventTypes';
import { UserActivityPageFilterPanel } from '../UserActivityPageFilterPanel/UserActivityPageFilterPanel';
import { useUserActivityFilterUrlParams } from '../../hooks/useUserActivityFilter';
import { Restricted } from '../Restricted';
import { useSessionUser } from '../../hooks/useSessionUser';

import s from './UserActivityPage.module.css';
import { tr } from './UserActivityPage.i18n';

interface UserActivityPageProps {
    userId: string;
}

const StyledTabs = styled(Tabs)`
    width: 100%;
    ${TabsMenu} {
        margin-left: ${gapL};
        gap: ${gapS};
    }

    ${TabContent} {
        overflow: unset;
    }
`;

const StyledTabLabel = styled(Text)`
    color: ${gray9};
`;

const UserActivityPageInner = ({
    user,
    userActivityEvents,
    loadMoreUserActivityEvents,
    hasNextPageOfUserActivityEvents,
    countUserActivityEvents,
    totalUserActivityEvents,
    userChangeEvents,
    hasNextPageOfChangeEvents,
    loadMoreChangeEvents,
    countUserChangeEvents,
    totalUserChangeEvents,
}: {
    user: TrpcRouterOutput['user']['getById'];
    userActivityEvents: TrpcRouterOutput['historyEvent']['getUserActivity']['events'];
    loadMoreUserActivityEvents: VoidFunction;
    hasNextPageOfUserActivityEvents?: boolean;
    countUserActivityEvents: number;
    totalUserActivityEvents: number;
    userChangeEvents?: TrpcRouterOutput['historyEvent']['getUserChanges']['events'];
    loadMoreChangeEvents: VoidFunction;
    hasNextPageOfChangeEvents?: boolean;
    countUserChangeEvents: number;
    totalUserChangeEvents: number;
}) => {
    const sessionUser = useSessionUser();
    return (
        <LayoutMain pageTitle={tr('User activity')}>
            <CommonHeader title={tr('User activity')} className={s.PageTitle} />

            <StyledTabs layout="horizontal" active="activities">
                <Tab name="activities" label={<StyledTabLabel>{tr('Activities')}</StyledTabLabel>}>
                    <UserActivityPageFilterPanel count={countUserActivityEvents} total={totalUserActivityEvents} />
                    <div className={s.PageContainer}>
                        <div>
                            {userActivityEvents.map((event) => (
                                <HistoryRecord
                                    event={{ ...event, actingUser: user } as HistoryEventData}
                                    key={event.id}
                                />
                            ))}
                        </div>
                        {nullable(hasNextPageOfUserActivityEvents, () => (
                            <Button
                                text={tr('Load more')}
                                onClick={loadMoreUserActivityEvents}
                                className={s.LoadMoreButton}
                            />
                        ))}
                    </div>
                </Tab>

                <Restricted visible={!!sessionUser.role?.viewHistoryEvents}>
                    <Tab name="changes" label={<StyledTabLabel>{tr('Changes')}</StyledTabLabel>}>
                        <UserActivityPageFilterPanel count={countUserChangeEvents} total={totalUserChangeEvents} />
                        <div className={s.PageContainer}>
                            {nullable(userChangeEvents, (events) =>
                                events.map((event) => (
                                    <HistoryRecord event={event as HistoryEventData} key={event.id} />
                                )),
                            )}
                            {nullable(hasNextPageOfChangeEvents, () => (
                                <Button
                                    text={tr('Load more')}
                                    onClick={loadMoreChangeEvents}
                                    className={s.LoadMoreButton}
                                />
                            ))}
                        </div>
                    </Tab>
                </Restricted>
            </StyledTabs>
        </LayoutMain>
    );
};

export const UserActivityPage = ({ userId }: UserActivityPageProps) => {
    const {
        values: { from, to },
    } = useUserActivityFilterUrlParams();

    const activityQuery = trpc.historyEvent.getUserActivity.useInfiniteQuery(
        {
            userId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

    const changesQuery = trpc.historyEvent.getUserChanges.useInfiniteQuery(
        {
            userId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

    const { data: user } = trpc.user.getById.useQuery(userId);

    if (!user || !activityQuery.data) return null;

    const userActivityEvents = activityQuery.data.pages.flatMap((page) => page.events);
    const lastPageOfUserActivityEvents = activityQuery.data.pages.at(-1);
    const loadMoreUserActivityEvents = activityQuery.fetchNextPage;
    const hasNextPageOfUserActivityEvents = activityQuery.hasNextPage;

    const userChangeEvents = changesQuery.data?.pages.flatMap((page) => page.events);
    const lastPageOfChangeEvents = changesQuery.data?.pages.at(-1);
    const loadMoreChangeEvents = changesQuery.fetchNextPage;
    const hasNextPageOfChangeEvents = changesQuery.hasNextPage;

    return (
        <UserActivityPageInner
            user={user}
            userActivityEvents={userActivityEvents}
            loadMoreUserActivityEvents={loadMoreUserActivityEvents}
            hasNextPageOfUserActivityEvents={hasNextPageOfUserActivityEvents}
            countUserActivityEvents={lastPageOfUserActivityEvents?.count ?? 0}
            totalUserActivityEvents={lastPageOfUserActivityEvents?.total ?? 0}
            userChangeEvents={userChangeEvents}
            loadMoreChangeEvents={loadMoreChangeEvents}
            hasNextPageOfChangeEvents={hasNextPageOfChangeEvents}
            countUserChangeEvents={lastPageOfChangeEvents?.count ?? 0}
            totalUserChangeEvents={lastPageOfChangeEvents?.total ?? 0}
        />
    );
};
