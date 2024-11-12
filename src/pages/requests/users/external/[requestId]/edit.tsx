import { ExternalUserCreationRequestPage } from '../../../../../components/ExternalUserCreationRequestPage/ExternalUserCreationRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.createUser && !session.user.role?.editUserCreationRequests) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
        await ssg.userCreationRequest.getById.fetch(stringIds.requestId);

        return { requestId: stringIds.requestId };
    },
});

export default function ExternalUserCreationRequest({ requestId }: { requestId: string }) {
    const requestFormQuery = trpc.userCreationRequest.getRequestForExternalEmployeeById.useQuery(requestId);

    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    if (!requestFormQuery.data) return null;

    return (
        <ExternalUserCreationRequestPage
            requestId={requestId}
            request={requestFormQuery.data}
            type="edit"
            requestStatus={requestQuery.data?.status || undefined}
        />
    );
}
