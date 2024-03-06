import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';

import { MembershipInfo } from '../modules/userTypes';

import { UserListItem } from './UserListItem/UserListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';

interface MembershipUserListItemEditableProps {
    membership: MembershipInfo;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr 28px 28px;
    gap: ${gapS};
    width: 600px;
`;

export const MembershipUserListItemEditable = ({ membership }: MembershipUserListItemEditableProps) => {
    return (
        <StyledRow>
            <UserListItem user={membership.user} />
            <Text size="xs" color={gray9}>
                {membership.roles.map((role) => role.name).join(', ')}
            </Text>

            <Text size="s" color={gray9}>
                {membership.percentage}
            </Text>

            <MembershipEditMenu membership={membership} />
        </StyledRow>
    );
};
