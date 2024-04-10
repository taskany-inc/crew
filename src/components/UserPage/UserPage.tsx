import { Text, Button, nullable, Modal } from '@taskany/bricks';
import { gapL, gapS, gapXl, gray10, gray8, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { PageSep } from '../PageSep';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain';
import { UserSummary } from '../UserSummary/UserSummary';
import { UserContacts } from '../UserContacts/UserContacts';
import { UserMembershipsList } from '../UserMembershipsList/UserMembershipsList';
import UserUpdateForm from '../UserUpdateForm/UserUpdateForm';
import { UserDevices } from '../UserDevices/UserDevices';
import { UserPic } from '../UserPic';
import { DeactivateProfileForm } from '../DeactivateProfileForm/DeactivateProvileForm';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { UserBonusPoints } from '../UserBonusPoints/UserBonusPoints';
import { UserAchievementList } from '../UserAchievementList/UserAchievementList';
import { UserListItem } from '../UserListItem/UserListItem';
import { NarrowSection } from '../NarrowSection';
import { GroupListItem } from '../GroupListItem';

import { tr } from './UserPage.i18n';

const StyledHeader = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr max-content;
    gap: ${gapXl};
    padding: 0 ${gapL} ${gapL} ${gapL};
    align-items: end;
`;

const StyledUserNameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledUserInfoWrapper = styled.div`
    margin-top: ${gapL};
    padding: 0 ${gapL};
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: ${gapL};
    align-items: start;
`;

const StyledLeftPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;

const StyledRightPanel = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapL};
`;

const EditButtonsWrapper = styled.div`
    display: flex;
    gap: ${gapS};
`;

const StyledUserListWrapper = styled.div`
    margin-bottom: ${gapS};
`;

interface UserPageProps {
    userId: string;
}

export const UserPage = ({ userId }: UserPageProps) => {
    const { showGroupPreview } = usePreviewContext();
    const [openUpdateUserForm, setOpenUpdateUserForm] = useState(false);
    const [openDeactivateUserForm, setOpenDeactivateUserForm] = useState(false);
    const { data } = useSession();

    const userQuery = trpc.user.getById.useQuery(userId);
    const user = userQuery.data;

    if (!user) return null;

    const orgMembership = user.memberships.find((m) => m.group.organizational);
    const orgRoles = orgMembership?.roles.map((r) => r.name).join(', ');

    return (
        <LayoutMain pageTitle={user.name}>
            <StyledHeader>
                <UserPic size={150} user={user} />
                <StyledUserNameWrapper>
                    {nullable(orgRoles, (r) => (
                        <Text size="s" color={gray8} weight="bold">
                            {r}
                        </Text>
                    ))}

                    {nullable(orgMembership, (m) => (
                        <Link href={pages.team(m.groupId)} onClick={() => showGroupPreview(m.groupId)}>
                            <Text size="l" color={gray10}>
                                {m.group.name}
                            </Text>
                        </Link>
                    ))}

                    <Text size="xxl" weight="bold" color={user.active ? textColor : gray8}>
                        {user.name}
                        {!user.active && tr(' [inactive]')}
                    </Text>
                </StyledUserNameWrapper>
                <Modal visible={openUpdateUserForm} width={600}>
                    <UserUpdateForm user={user} onClose={() => setOpenUpdateUserForm(false)} />
                </Modal>
                <Modal visible={openDeactivateUserForm} width={600}>
                    <DeactivateProfileForm user={user} onClose={() => setOpenDeactivateUserForm(false)} />
                </Modal>
                <EditButtonsWrapper>
                    {nullable(user.meta.isEditable, () => (
                        <Button onClick={() => setOpenUpdateUserForm(true)} text={tr('Edit')} size="s" />
                    ))}
                    {nullable(user.meta.isActiveStateEditable, () => (
                        <Button
                            onClick={() => setOpenDeactivateUserForm(true)}
                            text={user.active ? tr('Deactivate') : tr('Reactivate')}
                            view="danger"
                            outline
                            size="s"
                        />
                    ))}
                </EditButtonsWrapper>
            </StyledHeader>

            <PageSep />

            <StyledUserInfoWrapper>
                <StyledLeftPanel>
                    {nullable(user.meta.isBonusViewable, () => (
                        <UserBonusPoints user={user} />
                    ))}
                    {nullable(user.achievements?.length || data?.access.achievement.create, () => (
                        <UserAchievementList user={user} isEditable={!!data?.access.achievement.create} />
                    ))}

                    <UserContacts user={user} />

                    <UserDevices user={user} />
                </StyledLeftPanel>

                <StyledRightPanel>
                    <UserSummary user={user} />

                    <UserMembershipsList user={user} />

                    {nullable(user.supervisorOf?.length, () => (
                        <NarrowSection title={tr('Supervisor of users')}>
                            {user.supervisorOf?.map((u) => (
                                <StyledUserListWrapper key={u.id}>
                                    <UserListItem user={u} />
                                </StyledUserListWrapper>
                            ))}
                        </NarrowSection>
                    ))}

                    {nullable(user.supervisorIn?.length, () => (
                        <NarrowSection title={tr('Supervisor in teams')}>
                            {user.supervisorIn?.map((group) => (
                                <GroupListItem groupId={group.id} groupName={group.name} key={group.id} />
                            ))}
                        </NarrowSection>
                    ))}
                </StyledRightPanel>
            </StyledUserInfoWrapper>
        </LayoutMain>
    );
};
