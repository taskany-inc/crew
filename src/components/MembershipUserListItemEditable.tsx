import styled from 'styled-components';
import { nullable, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';

import { MembershipInfoWithUserOrganizationUnit } from '../modules/userTypes';
import { getOrgUnitTitle } from '../utils/organizationUnit';

import { UserListItem } from './UserListItem/UserListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';
import { Restricted } from './Restricted';

interface MembershipUserListItemEditableProps {
    membership: MembershipInfoWithUserOrganizationUnit;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1.5fr 28px 28px;
    align-items: center;
    gap: ${gapS};
    width: 650px;
`;

export const MembershipUserListItemEditable = ({ membership }: MembershipUserListItemEditableProps) => {
    const { organizationUnit } = membership.user;

    return (
        <StyledRow>
            <UserListItem user={membership.user} />
            <Text size="xs" color={gray9}>
                {nullable(organizationUnit, (v) => `${getOrgUnitTitle(v)}: `)}
                {membership.roles.map((role) => role.name).join(', ')}
            </Text>

            <Text size="s" color={gray9}>
                {membership.percentage}
            </Text>

            <Restricted visible={membership.group.meta.isEditable}>
                <MembershipEditMenu membership={membership} />
            </Restricted>
        </StyledRow>
    );
};
