import { trpc } from '../../trpc/trpcClient';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { ScheduledDeactivationItem } from '../ScheduledDeactivationItem/ScheduledDeactivationItem';

export const ScheduledDeactivationList = () => {
    const scheduledDeactivations = trpc.scheduledDeactivation.getList.useQuery();

    return (
        <ProfilesManagementLayout>
            {scheduledDeactivations.data?.map((scheduledDeactivation) => (
                <ScheduledDeactivationItem
                    key={scheduledDeactivation.id}
                    scheduledDeactivation={scheduledDeactivation}
                />
            ))}
        </ProfilesManagementLayout>
    );
};
