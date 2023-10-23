import { UserPic, Text, Button, nullable, Modal } from '@taskany/bricks';
import { gapL, gapS, gapXl, gray10, gray6 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';

import { PageSep } from '../PageSep';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';
import { usePreviewContext } from '../../context/preview-context';
import { pages } from '../../hooks/useRouter';
import { UserContacts } from '../users/UserContacts';
import { UserBonusPoints } from '../users/UserBonusPoints';
import { UserSummary } from '../users/UserSummary';
import { UserMembershipsList } from '../users/UserMembershipsList';
import UserUpdateForm from '../users/form/UserUpdateForm';
import { UserDevices } from '../UserDevices/UserDevices';

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

type UserPageProps = {
    userId: string;
};

export const UserPage = ({ userId }: UserPageProps) => {
    const { showGroupPreview } = usePreviewContext();
    const [openUpdateUserForm, setOpenUpdateUserForm] = useState(false);

    const userQuery = trpc.user.getById.useQuery(userId);
    const user = userQuery.data;

    if (!user) return null;

    const groupMemberships = user.memberships;

    // TODO: select real org group
    const orgStructureMembership = groupMemberships[0];

    return (
        <LayoutMain pageTitle={user.name}>
            <StyledHeader>
                <UserPic size={150} name={user.name} src={user.image} email={user.email} />
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
                    <Text size="xxl" weight="bold">
                        {user.name}
                    </Text>
                </StyledUserNameWrapper>
                <Modal visible={openUpdateUserForm} width={600}>
                    <UserUpdateForm user={user} onClose={() => setOpenUpdateUserForm(false)} />
                </Modal>
                {nullable(user.meta.isEditable, () => (
                    <Button onClick={() => setOpenUpdateUserForm(true)} text={tr('Edit')} size="s" />
                ))}
            </StyledHeader>

            <PageSep />

            <StyledUserInfoWrapper>
                <StyledLeftPanel>
                    <UserBonusPoints user={user} />

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
