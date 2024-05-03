import { nullable } from '@taskany/bricks';
import { Button, Text } from '@taskany/bricks/harmony';

import { TrpcRouterOutput, trpc } from '../../trpc/trpcClient';
import { HistoryRecord } from '../HistoryRecord/HistoryRecord';
import { LayoutMain } from '../LayoutMain';
import { HistoryEventData } from '../../modules/historyEventTypes';

import s from './UserActivityPage.module.css';
import { tr } from './UserActivityPage.i18n';

interface UserActivityPageProps {
    userId: string;
}

const UserActivityPageInner = ({
    user,
    events,
    loadMore,
    hasNext,
}: {
    user: TrpcRouterOutput['user']['getById'];
    events: TrpcRouterOutput['historyEvent']['getUserActivity']['events'];
    loadMore: VoidFunction;
    hasNext?: boolean;
}) => {
    return (
        <LayoutMain pageTitle={tr('User activity')}>
            <div className={s.PageContainer}>
                <Text size="xxl" weight="bolder" className={s.PageTitle}>
                    {tr('User activity')}
                </Text>
                <div>
                    {events.map((event) => (
                        <HistoryRecord event={{ ...event, actingUser: user } as HistoryEventData} key={event.id} />
                    ))}
                </div>
                {nullable(hasNext, () => (
                    <Button text={tr('Load more')} onClick={loadMore} className={s.LoadMoreButton} />
                ))}
            </div>
        </LayoutMain>
    );
};

export const UserActivityPage = ({ userId }: UserActivityPageProps) => {
    const activityQuery = trpc.historyEvent.getUserActivity.useInfiniteQuery(
        { userId },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );
    const events = activityQuery.data?.pages.flatMap((page) => page.events);
    const loadMore = activityQuery.fetchNextPage;
    const hasNext = activityQuery.hasNextPage;
    const { data: user } = trpc.user.getById.useQuery(userId);

    if (!user || !events) return null;

    return <UserActivityPageInner user={user} events={events} loadMore={loadMore} hasNext={hasNext} />;
};
