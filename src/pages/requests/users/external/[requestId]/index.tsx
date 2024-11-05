import React from 'react';

import { ExternalUserCreationRequestPage } from '../../../../../components/ExternalUserCreationRequestPage/ExternalUserCreationRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { trpc } from '../../../../../trpc/trpcClient';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { InferServerSideProps } from '../../../../../utils/types';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { requestId: true },
    action: async ({ stringIds, session, ssg }) => {
        if (!session.user.role?.createUser || !session.user.role.editUserCreationRequests) {
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

export default function SectionCreationPage({ stringIds }: InferServerSideProps<typeof getServerSideProps>) {
    const requestFormQuery = trpc.userCreationRequest.getRequestForExternalEmployeeById.useQuery(stringIds.requestId);

    const requestQuery = trpc.userCreationRequest.getById.useQuery(stringIds.requestId);

    if (!requestFormQuery.data) return null;

    return (
        <ExternalUserCreationRequestPage
            requestId={stringIds.requestId}
            request={requestFormQuery.data}
            type="readOnly"
            requestStatus={requestQuery.data?.status || undefined}
        />
    );
}
