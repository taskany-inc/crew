import { SupplementalPositionRequest } from '../../../components/SupplementalPositionRequest/SupplementalPositionRequest';
import { pages } from '../../../hooks/useRouter';
import { trpc } from '../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';
import { ExternalServiceName, findService } from '../../../utils/externalServices';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: async ({ stringIds, session }) => {
        if (!session.user.role?.editUserActiveState) {
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

export default function CreationPage({ userId }: { userId: string }) {
    const { data: user } = trpc.user.getById.useQuery(userId);

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);

    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);
    const workEmail = findService(ExternalServiceName.WorkEmail, userServiceQuery.data);

    const personalEmail = findService(ExternalServiceName.PersonalEmail, userServiceQuery.data);

    if (!user) return null;

    return (
        <SupplementalPositionRequest
            user={user}
            phone={phone}
            workEmail={workEmail}
            personalEmail={personalEmail}
            type="new"
        />
    );
}
