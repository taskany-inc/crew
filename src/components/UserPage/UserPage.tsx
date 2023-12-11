import { Text, Button, nullable, Modal } from '@taskany/bricks';
import { gapL, gapS, gapXl, gray10, gray6, gray8, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';

import { PageSep } from '../PageSep';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain';
import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { UserSummary } from '../UserSummary/UserSummary';
import { UserContacts } from '../UserContacts/UserContacts';
import { UserBonusPoints } from '../UserBonusPoints/UserBonusPoints';
import { UserMembershipsList } from '../UserMembershipsList/UserMembershipsList';
import UserUpdateForm from '../UserUpdateForm/UserUpdateForm';
import { UserDevices } from '../UserDevices/UserDevices';
import { UserPic } from '../UserPic';
import { DeactivateProfileForm } from '../DeactivateProfileForm/DeactivateProvileForm';

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

const StyledGroupLink = styled(Link)`
    font-size: 21px;
    color: ${gray10};
    font-weight: 700;
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

type UserPageProps = {
    userId: string;
};

export const UserPage = ({ userId }: UserPageProps) => {
    const { showGroupPreview } = usePreviewContext();
    const [openUpdateUserForm, setOpenUpdateUserForm] = useState(false);
    const [openDeactivateUserForm, setOpenDeactivateUserForm] = useState(false);

    const userQuery = trpc.user.getById.useQuery(userId);
    const user = userQuery.data;

    if (!user) return null;

    const groupMemberships = user.memberships;

    // TODO: select real org group
    const orgStructureMembership = groupMemberships[0];

    return (
        <LayoutMain pageTitle={user.name}>
            <StyledHeader>
                <UserPic size={150} user={user} />
                <StyledUserNameWrapper>
                    <Text size="s" color={gray6} weight="bold">
                        {!!orgStructureMembership && orgStructureMembership.roles.map((role) => role.name).join(', ')}
                    </Text>

                    {!!orgStructureMembership && (
                        <StyledGroupLink
                            href={pages.team(orgStructureMembership.id)}
                            onClick={() => showGroupPreview(orgStructureMembership.group.id)}
                        >
                            {orgStructureMembership.group.name}
                        </StyledGroupLink>
                    )}
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
                    {nullable(user.meta.isDeactivatable, () => (
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

                    <UserContacts user={user} />

                    <UserDevices user={user} />
                </StyledLeftPanel>

                <StyledRightPanel>
                    <UserSummary user={user} />

                    <UserMembershipsList user={user} />
                </StyledRightPanel>
            </StyledUserInfoWrapper>
        </LayoutMain>
    );
};
