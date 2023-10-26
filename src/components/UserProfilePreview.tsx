import { ModalPreview, nullable } from '@taskany/bricks';

import { pages } from '../hooks/useRouter';
import { trpc } from '../trpc/trpcClient';
import { usePreviewContext } from '../contexts/previewContext';

import { PreviewContent } from './PreviewContent';
import { PreviewHeader } from './PreviewHeader';
import { UserSummary } from './UserSummary/UserSummary';
import { UserContacts } from './UserContacts/UserContacts';
import { UserMembershipsList } from './UserMembershipsList/UserMembershipsList';

type UserProps = {
    userId: string;
};

const UserProfilePreview = ({ userId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const userQuery = trpc.user.getById.useQuery(userId);

    // TODO: select real org group
    const orgStructureMembership = userQuery.data?.memberships[0];
    const orgStructureRoles = orgStructureMembership?.roles.map((r) => r.name).join(', ');

    return (
        <>
            {nullable(userQuery.data, (user) => (
                <ModalPreview visible onClose={hidePreview}>
                    <PreviewHeader
                        preTitle={orgStructureRoles}
                        user={user}
                        subtitle={orgStructureMembership?.group.name}
                        title={user.name}
                        link={pages.user(user.id)}
                    />
                    <PreviewContent>
                        <UserSummary user={user} />

                        <UserMembershipsList user={user} />

                        <UserContacts user={user} />
                    </PreviewContent>
                </ModalPreview>
            ))}
        </>
    );
};

export default UserProfilePreview;
