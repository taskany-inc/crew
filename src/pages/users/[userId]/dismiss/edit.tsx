import { ScheduledDismissalPage } from '../../../../components/ScheduledDismissalPage/ScheduledDismissalPage';
import { pages } from '../../../../hooks/useRouter';
import { trpc } from '../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../../utils/externalServices';

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

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

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
