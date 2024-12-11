import { ScheduledDismissalPage } from '../../../../components/ScheduledDismissalPage/ScheduledDismissalPage';
import { pages } from '../../../../hooks/useRouter';
import { trpc } from '../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: ({ stringIds, session }) => {
        if (!session.user.role?.editScheduledDeactivation) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
        return { userId: stringIds.userId };
    },
});

export default function ExternalUserCreationRequest({ userId }: { userId: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);

    const userDevices = userDeviceQuery.data || [];

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);
    const phone = userServiceQuery.data?.find((s) => s.serviceName === 'Phone')?.serviceId;

    const workEmail = userServiceQuery.data?.find(
        (s) => s.serviceName === 'Email' && s.service.type === 'workEmail',
    )?.serviceId;

    const personalEmail = userServiceQuery.data?.find(
        (s) => s.serviceName === 'Email' && s.service.type === 'personalEmail',
    )?.serviceId;

    if (!user) return null;

    return (
        <ScheduledDismissalPage
            type="edit"
            user={user}
            phone={phone}
            userDevices={userDevices}
            workEmail={workEmail}
            personalEmail={personalEmail}
        />
    );
}
