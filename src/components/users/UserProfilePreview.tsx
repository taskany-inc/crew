import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { ModalPreview, Text } from '@taskany/bricks';
import { gapM, gapS, gray9 } from '@taskany/colors';

import { PreviewHeader } from '../PreviewHeader';
import { PreviewContent } from '../PreviewContent';
import { UserListItem } from '../UserListItem';
import { UserGroupListItem } from '../UserGroupListItem';
import { NarrowSection } from '../NarrowSection';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../context/preview-context';

import { UserContacts } from './UserContacts';
import { tr } from './users.i18n';
import { AddTeamToUserForm } from './AddTeamToUserForm';

type UserProps = {
    user: User;
    groupName?: string;
    role?: string;
};

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

const StyledMembershipList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

const UserProfilePreview = ({ user, groupName, role }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const membershipsQuery = trpc.user.getMemberships.useQuery(user.id);

    return (
        <ModalPreview visible onClose={hidePreview}>
            <PreviewHeader
                preTitle={role}
                user={user}
                subtitle={groupName}
                title={user.name}
                link={pages.user(user.id)}
            />
            <PreviewContent>
                <NarrowSection title={tr('Quick summary')}>
                    <StyledSupervisorText size="m" color={gray9}>
                        {tr('Supervisor')}
                        <UserListItem user={{ name: 'Placeholder user', email: 'placeholder@example.com' } as User} />
                    </StyledSupervisorText>
                </NarrowSection>

                <NarrowSection title={tr('Teams')}>
                    <StyledMembershipList>
                        {membershipsQuery.data?.map((membership) => (
                            <UserGroupListItem key={membership.id} membership={membership} />
                        ))}
                    </StyledMembershipList>

                    <AddTeamToUserForm userId={user.id} />
                </NarrowSection>

                <UserContacts user={user} userServices={[]} />
            </PreviewContent>
        </ModalPreview>
    );
};

export default UserProfilePreview;
