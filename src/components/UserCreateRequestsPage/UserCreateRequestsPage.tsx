import { useState } from 'react';
import { nullable } from '@taskany/bricks';

import { useBoolean } from '../../hooks/useBoolean';
import { CommonHeader } from '../CommonHeader';
import { LayoutMain, PageContent } from '../LayoutMain';
import { UserCreationRequestModal } from '../UserCreationRequestModal/UserCreationRequestModal';
import { UserCreateRequestsTable } from '../UserCreateRequestsTable/UserCreateRequestsTable';
import { UserRequest } from '../../trpc/inferredTypes';

import { tr } from './UserCreateRequestsPage.i18n';

export const UserCreateRequestsPage = () => {
    const userCreateRequestModalVisible = useBoolean(false);
    const [request, setRequest] = useState<UserRequest | null>(null);

    return (
        <LayoutMain pageTitle={tr('Requests for user creation')}>
            <CommonHeader title={tr('Requests for user creation')} />
            <PageContent>
                <UserCreateRequestsTable
                    openModal={userCreateRequestModalVisible.setTrue}
                    onSelectRequest={setRequest}
                />
            </PageContent>

            {nullable(request, (r) => (
                <UserCreationRequestModal
                    visible={userCreateRequestModalVisible.value}
                    onClose={userCreateRequestModalVisible.setFalse}
                    request={r}
                />
            ))}
        </LayoutMain>
    );
};
