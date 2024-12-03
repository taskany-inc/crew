import { DecreePage } from '../../../../../components/DecreePage/DecreePage';
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
        const request = await ssg.userCreationRequest.getDecreeRequestById.fetch(stringIds.requestId);

        if (request.userTargetId) {
            await ssg.user.getById.fetch(request.userTargetId);
        }

        return { requestId: stringIds.requestId };
    },
});

export default function DecreeRequestEditPage({ requestId }: { requestId: string }) {
    const { data } = trpc.userCreationRequest.getDecreeRequestById.useQuery(requestId);

    if (!data) return null;

    return <DecreePage mode="edit" request={data} />;
}
