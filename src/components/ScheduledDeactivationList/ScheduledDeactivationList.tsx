import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain';
import { ScheduledDeactivationItem } from '../ScheduledDeactivationItem/ScheduledDeactivationItem';

import { tr } from './ScheduledDeactivationList.i18n';

export const ScheduledDeactivationList = () => {
    const scheduledDeactivations = trpc.scheduledDeactivation.getList.useQuery();

    return (
        <LayoutMain pageTitle={tr('Scheduled deactivations')}>
            {scheduledDeactivations.data?.map((scheduledDeactivation) => (
                <ScheduledDeactivationItem
                    key={scheduledDeactivation.id}
                    scheduledDeactivation={scheduledDeactivation}
                />
            ))}
        </LayoutMain>
    );
};
