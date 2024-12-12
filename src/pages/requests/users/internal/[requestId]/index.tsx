import { InternalUserCreationRequestPage } from '../../../../../components/InternalUserCreationRequestPage/InternalUserCreationRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },

    action: async ({ ssg, session, stringIds }) => {
        if (!session.user.role?.readManyInternalUserRequests) {
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

export default function CreationPage({ requestId }: { requestId: string }) {
    const requestFormQuery = trpc.userCreationRequest.getRequestForInternalEmployeeById.useQuery(requestId);

    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    if (!requestFormQuery.data) return null;

    return (
        <InternalUserCreationRequestPage
            requestId={requestId}
            request={requestFormQuery.data}
            type="readOnly"
            requestStatus={requestQuery.data?.status || undefined}
        />
    );
}
