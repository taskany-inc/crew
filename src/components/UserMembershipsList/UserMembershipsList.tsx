import { useMemo } from 'react';
import { Group, User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { UserMemberships } from '../../modules/userTypes';
import { MembershipGroupListItemEditable } from '../MembershipGroupListItemEditable';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';
import { useUserMutations } from '../../modules/userHooks';

import { tr } from './UserMembershipsList.i18n';

const StyledMembershipList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
    width: 600px;
`;

type UserMembershipsProps = {
    user: User & UserMemberships;
};

export const UserMembershipsList = ({ user }: UserMembershipsProps) => {
    const { addUserToGroup } = useUserMutations();

    const onAddUserToTeam = async (group: Group) => {
        await addUserToGroup.mutateAsync({ userId: user.id, groupId: group.id });
    };
    const groupFilter = useMemo(() => {
        return user.memberships.map(({ groupId }) => groupId);
    }, [user.memberships]);

    return (
        <NarrowSection title={tr('Teams with participation')}>
            <StyledMembershipList>
                {user.memberships.map((membership) => (
                    <MembershipGroupListItemEditable key={membership.id} membership={membership} />
                ))}
            </StyledMembershipList>

            <InlineGroupSelectForm
                triggerText={tr('Add team')}
                actionText={tr('Add')}
                filter={groupFilter}
                onSubmit={onAddUserToTeam}
            />
        </NarrowSection>
    );
};
