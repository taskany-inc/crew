import { trpc } from '../../trpc/trpcClient';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { UserCreationRequestItem } from '../UserCreationRequestItem/UserCreationRequestItem';

export const UserCreationRequestList = () => {
    const requestsQuery = trpc.userCreationRequest.getList.useQuery({});

    return (
        <ProfilesManagementLayout>
            {requestsQuery.data?.map((request) => (
                <UserCreationRequestItem key={request.id} request={request} />
            ))}
        </ProfilesManagementLayout>
    );
};
