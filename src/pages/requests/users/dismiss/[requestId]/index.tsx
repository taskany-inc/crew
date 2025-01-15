import { notFound } from 'next/navigation';

import { ScheduledDismissalPage } from '../../../../../components/ScheduledDismissalPage/ScheduledDismissalPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../../../utils/externalServices';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.editScheduledDeactivation) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }

        const scheduledDeactivation = await ssg.scheduledDeactivation.getById.fetch(stringIds.requestId);

        const { user } = scheduledDeactivation;

        if (!scheduledDeactivation) {
            return notFound();
        }

        return { userId: user.id, scheduledDeactivationId: scheduledDeactivation.id };
    },
});

export default function ExternalUserCreationRequest({
    userId,
    scheduledDeactivationId,
}: {
    userId: string;
    scheduledDeactivationId: string;
}) {
    const { data: user } = trpc.user.getById.useQuery(userId);
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);
    const userDevices = userDeviceQuery.data || [];

    const { data: scheduledDeactivation } = trpc.scheduledDeactivation.getById.useQuery(scheduledDeactivationId);

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

    if (!user || !scheduledDeactivation) return null;

    return (
        <ScheduledDismissalPage
            type="readOnly"
            user={user}
            phone={phone}
            userDevices={userDevices}
            workEmail={workEmail}
            personalEmail={personalEmail}
            scheduledDeactivation={scheduledDeactivation}
        />
    );
}
