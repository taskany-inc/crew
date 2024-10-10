import { nullable } from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';

import { CommonHeader } from '../CommonHeader';
import { TrpcRouterOutput, trpc } from '../../trpc/trpcClient';
import { HistoryRecord } from '../HistoryRecord/HistoryRecord';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { HistoryEventData } from '../../modules/historyEventTypes';
import { UserActivityPageFilterPanel } from '../UserActivityPageFilterPanel/UserActivityPageFilterPanel';
import { useUserActivityFilterUrlParams } from '../../hooks/useUserActivityFilter';

import s from './LogsPage.module.css';
import { tr } from './LogsPage.i18n';

const LogsPageInner = ({
    logs,
    loadMoreLogs,
    hasNextPageOfLogs,
    count,
    total,
}: {
    logs: TrpcRouterOutput['historyEvent']['getAll']['events'];
    loadMoreLogs: VoidFunction;
    hasNextPageOfLogs?: boolean;
    count: number;
    total: number;
}) => {
    return (
        <LayoutMain pageTitle={tr('All logs')}>
            <CommonHeader title={tr('All logs')} className={s.PageTitle} />

            <UserActivityPageFilterPanel count={count} total={total} />
            <div className={s.PageContainer}>
                <div>
                    {logs.map((event) => (
                        <HistoryRecord event={event as HistoryEventData} key={event.id} />
                    ))}
                </div>
                {nullable(hasNextPageOfLogs, () => (
                    <Button text={tr('Load more')} onClick={loadMoreLogs} className={s.LoadMoreButton} />
                ))}
            </div>
        </LayoutMain>
    );
};

export const LogsPage = () => {
    const {
        values: { from, to },
    } = useUserActivityFilterUrlParams();

    const logsQuery = trpc.historyEvent.getAll.useInfiniteQuery(
        {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

    if (!logsQuery.data) return null;

    const logs = logsQuery.data.pages.flatMap((page) => page.events);
    const lastPageOfLogs = logsQuery.data.pages.at(-1);
    const loadMoreLogs = logsQuery.fetchNextPage;
    const hasNextPageOfLogs = logsQuery.hasNextPage;

    return (
        <LogsPageInner
            logs={logs}
            loadMoreLogs={loadMoreLogs}
            hasNextPageOfLogs={hasNextPageOfLogs}
            count={lastPageOfLogs?.count ?? 0}
            total={lastPageOfLogs?.total ?? 0}
        />
    );
};
