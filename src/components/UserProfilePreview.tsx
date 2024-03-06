import { ModalPreview, nullable } from '@taskany/bricks';
import styled from 'styled-components';

import { pages } from '../hooks/useRouter';
import { trpc } from '../trpc/trpcClient';
import { usePreviewContext } from '../contexts/previewContext';

import { PreviewContent } from './PreviewContent';
import { PreviewHeader } from './PreviewHeader/PreviewHeader';
import { UserSummary } from './UserSummary/UserSummary';
import { UserContacts } from './UserContacts/UserContacts';
import { UserMembershipsList } from './UserMembershipsList/UserMembershipsList';

interface UserProps {
    userId: string;
}

const StyledModalPreview = styled(ModalPreview)`
    display: flex;
    flex-direction: column;
`;

const UserProfilePreview = ({ userId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const userQuery = trpc.user.getById.useQuery(userId);

    return (
        <>
            {nullable(userQuery.data, (user) => (
                <StyledModalPreview visible onClose={hidePreview}>
                    <PreviewHeader subtitle={user.title} user={user} title={user.name} link={pages.user(user.id)} />
                    <PreviewContent>
                        <UserSummary user={user} />

                        <UserMembershipsList user={user} />

                        <UserContacts user={user} />
                    </PreviewContent>
                </StyledModalPreview>
            ))}
        </>
    );
};

export default UserProfilePreview;
