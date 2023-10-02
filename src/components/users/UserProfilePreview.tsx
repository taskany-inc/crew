import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { ModalPreview, Text, nullable } from '@taskany/bricks';
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
    userId: string;
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
                        <NarrowSection title={tr('Quick summary')}>
                            <StyledSupervisorText size="m" color={gray9}>
                                {tr('Supervisor')}
                                <UserListItem
                                    user={{ name: 'Placeholder user', email: 'placeholder@example.com' } as User}
                                />
                            </StyledSupervisorText>
                        </NarrowSection>

                        <NarrowSection title={tr('Teams')}>
                            <StyledMembershipList>
                                {user.memberships.map((membership) => (
                                    <UserGroupListItem key={membership.id} membership={membership} />
                                ))}
                            </StyledMembershipList>

                            <AddTeamToUserForm userId={user.id} />
                        </NarrowSection>

                        <UserContacts user={user} userServices={[]} />
                    </PreviewContent>
                </ModalPreview>
            ))}
        </>
    );
};

export default UserProfilePreview;
