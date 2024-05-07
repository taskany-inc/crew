import { nullable } from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';

import { CommonHeader } from '../CommonHeader';
import { TrpcRouterOutput, trpc } from '../../trpc/trpcClient';
import { HistoryRecord } from '../HistoryRecord/HistoryRecord';
import { LayoutMain } from '../LayoutMain';
import { HistoryEventData } from '../../modules/historyEventTypes';
import { UserActivityPageFilterPanel } from '../UserActivityPageFilterPanel/UserActivityPageFilterPanel';
import { useUserActivityFilterUrlParams } from '../../hooks/useUserActivityFilter';

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
    count,
    total,
}: {
    user: TrpcRouterOutput['user']['getById'];
    events: TrpcRouterOutput['historyEvent']['getUserActivity']['events'];
    loadMore: VoidFunction;
    hasNext?: boolean;
    count: number;
    total: number;
}) => {
    return (
        <LayoutMain pageTitle={tr('User activity')}>
            <CommonHeader title={tr('User activity')} className={s.PageTitle} />

            <UserActivityPageFilterPanel count={count} total={total} />

            <div className={s.PageContainer}>
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

    const { data: user } = trpc.user.getById.useQuery(userId);

    if (!user || !activityQuery.data) return null;

    const events = activityQuery.data.pages.flatMap((page) => page.events);
    const lastPage = activityQuery.data.pages.at(-1);
    const loadMore = activityQuery.fetchNextPage;
    const hasNext = activityQuery.hasNextPage;

    return (
        <UserActivityPageInner
            user={user}
            events={events}
            loadMore={loadMore}
            hasNext={hasNext}
            count={lastPage?.count ?? 0}
            total={lastPage?.total ?? 0}
        />
    );
};
