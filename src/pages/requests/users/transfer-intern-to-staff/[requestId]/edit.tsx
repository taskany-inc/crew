import { notFound } from 'next/navigation';

import { TransferInternToStaffPage } from '../../../../../components/TransferInternToStaffPage/TransferInternToStaffPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../../../utils/externalServices';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
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

        const request = await ssg.userCreationRequest.getTransferInternToStaffById.fetch(stringIds.requestId);

        const { userId } = request;

        if (!request) {
            return notFound();
        }

        return { userId, requestId: stringIds.requestId };
    },
});

export default function EditTransferInternToStaffRequest({ userId, requestId }: { userId: string; requestId: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);
    const userDevices = userDeviceQuery.data || [];

    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    const { data: requestForm } = trpc.userCreationRequest.getTransferInternToStaffById.useQuery(requestId);

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

    if (!user || !requestForm) return null;

    return (
        <TransferInternToStaffPage
            type="edit"
            user={user}
            phone={phone}
            userDevices={userDevices}
            workEmail={workEmail}
            personalEmail={personalEmail}
            request={requestForm}
            requestId={requestId}
            requestStatus={requestQuery.data?.status || undefined}
        />
    );
}
