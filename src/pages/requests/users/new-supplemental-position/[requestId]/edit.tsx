import { notFound } from 'next/navigation';

import { SupplementalPositionRequest } from '../../../../../components/SupplementalPositionRequest/SupplementalPositionRequest';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../../../utils/externalServices';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.editUserActiveState) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }

        const requestResponce = await ssg.userCreationRequest.getSupplementalPositionRequestById.fetch(
            stringIds.requestId,
        );

        const { userTargetId } = requestResponce;

        if (!requestResponce) {
            return notFound();
        }

        return { userId: userTargetId, requestId: stringIds.requestId };
    },
});

export default function TransferUserInsideRequest({ userId, requestId }: { userId: string; requestId: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);

    const { data: request } = trpc.userCreationRequest.getSupplementalPositionRequestById.useQuery(requestId);

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

    if (!user || !request) return null;

    return (
        <SupplementalPositionRequest
            type="edit"
            user={user}
            phone={phone}
            workEmail={workEmail}
            personalEmail={personalEmail}
            request={request}
        />
    );
}
