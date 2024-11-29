import { ExternalFromMainOrgUserCreationRequestPage } from '../../../../../components/ExternalFromMainOrgUserCreationRequestPage/ExternalFromMainOrgUserCreationRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.editExternalFromMainUserRequest) {
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

export default function ExternalFromMainOrgUserCreationRequest({ requestId }: { requestId: string }) {
    const requestFormQuery = trpc.userCreationRequest.getRequestForExternalFromMainEmployeeById.useQuery(requestId);

    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    if (!requestFormQuery.data) return null;

    return (
        <ExternalFromMainOrgUserCreationRequestPage
            requestId={requestId}
            request={requestFormQuery.data}
            type="edit"
            requestStatus={requestQuery.data?.status || undefined}
        />
    );
}
