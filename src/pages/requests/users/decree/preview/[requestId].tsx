import React from 'react';

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

export default function DecreeRequestPreviewPage({ requestId }: { requestId: string }) {
    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    if (!requestQuery.data) return null;

    return <div>{`preview: ${requestQuery.data?.name}`}</div>;
}
