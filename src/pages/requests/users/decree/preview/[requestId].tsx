import React from 'react';

import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { DecreePage } from '../../../../../components/DecreePage/DecreePage';

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
        await ssg.userCreationRequest.getDecreeRequestById.fetch(stringIds.requestId);

        return { requestId: stringIds.requestId };
    },
});

export default function DecreeRequestPreviewPage({ requestId }: { requestId: string }) {
    const { data } = trpc.userCreationRequest.getDecreeRequestById.useQuery(requestId);

    if (!data) return null;

    return <DecreePage mode="read" request={data} />;
}
