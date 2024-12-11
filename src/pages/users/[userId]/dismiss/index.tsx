import { ScheduledDismissalPage } from '../../../../components/ScheduledDismissalPage/ScheduledDismissalPage';
import { pages } from '../../../../hooks/useRouter';
import { trpc } from '../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';
import { getActiveScheduledDeactivation } from '../../../../utils/getActiveScheduledDeactivation';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.editScheduledDeactivation) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }

        const user = await ssg.user.getById.fetch(stringIds.userId);

        const scheduledDeactivation = getActiveScheduledDeactivation(user);

        if (!scheduledDeactivation) {
            return {
                redirect: {
                    destination: pages.userDismissNew(stringIds.userId),
                    permanent: false,
                },
            };
        }
        const userServiceQuery = await ssg.service.getUserServices.fetch(stringIds.userId);
        const phone = userServiceQuery.find((s) => s.serviceName === 'Phone')?.serviceId;

        return { userId: stringIds.userId, phone };
    },
});
export default function ExternalUserCreationRequest({ userId, phone }: { userId: string; phone?: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);

    const userDevices = userDeviceQuery.data || [];

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const workEmail = userServiceQuery.data?.find(
        (s) => s.serviceName === 'Email' && s.service.type === 'workEmail',
    )?.serviceId;

    const personalEmail = userServiceQuery.data?.find(
        (s) => s.serviceName === 'Email' && s.service.type === 'personalEmail',
    )?.serviceId;

    if (!user) return null;

    return (
        <ScheduledDismissalPage
            type="readOnly"
            user={user}
            phone={phone}
            userDevices={userDevices}
            workEmail={workEmail}
            personalEmail={personalEmail}
        />
    );
}
