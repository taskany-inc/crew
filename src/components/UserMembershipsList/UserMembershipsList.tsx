import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';
import { Button } from '@taskany/bricks/harmony';
import { IconPlusCircleSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { UserMemberships } from '../../modules/userTypes';
import { MembershipGroupListItemEditable } from '../MembershipGroupListItemEditable';
import { useBoolean } from '../../hooks/useBoolean';
import { AddUserToTeamModal } from '../AddUserToTeamModal/AddUserToTeamModal';

import s from './UserMembershipsList.module.css';
import { tr } from './UserMembershipsList.i18n';

const StyledMembershipList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
    width: 600px;
`;

interface UserMembershipsProps {
    user: User & UserMemberships;
}

export const UserMembershipsList = ({ user }: UserMembershipsProps) => {
    const modalAddUserToTeamVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Teams with participation')}>
            <StyledMembershipList>
                {user.memberships.map((membership) => (
                    <MembershipGroupListItemEditable key={membership.id} membership={membership} />
                ))}
            </StyledMembershipList>

            <Button
                text={tr('Add team')}
                className={s.AddButton}
                view="clear"
                brick="right"
                iconLeft={<IconPlusCircleSolid size="s" />}
                onClick={modalAddUserToTeamVisibility.setTrue}
            />
            <AddUserToTeamModal
                visible={modalAddUserToTeamVisibility.value}
                onClose={modalAddUserToTeamVisibility.setFalse}
                userId={user.id}
                type="team-to-user"
            />
        </NarrowSection>
    );
};
