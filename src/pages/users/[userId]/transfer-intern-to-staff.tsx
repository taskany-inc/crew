import { TransferInternToStaffPage } from '../../../components/TransferInternToStaffPage/TransferInternToStaffPage';
import { pages } from '../../../hooks/useRouter';
import { trpc } from '../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../utils/externalServices';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: async ({ stringIds, session, ssg }) => {
        const userSettings = await ssg.user.getSettings.fetch();

        if (!session.user.role?.editUserActiveState || !userSettings.beta) {
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

export default function NewTransferInternToStaff({ userId }: { userId: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);

    const userDevices = userDeviceQuery.data || [];

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

    if (!user) return null;

    return (
        <TransferInternToStaffPage
            user={user}
            phone={phone}
            userDevices={userDevices}
            workEmail={workEmail}
            personalEmail={personalEmail}
            type="new"
        />
    );
}
