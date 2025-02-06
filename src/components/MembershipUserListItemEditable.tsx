import styled from 'styled-components';
import { nullable, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { useMemo } from 'react';

import { MembershipInfo } from '../modules/userTypes';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { getLastSupplementalPositions } from '../utils/supplementalPositions';

import { UserListItem } from './UserListItem/UserListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';
import { Restricted } from './Restricted';

interface MembershipUserListItemEditableProps {
    membership: MembershipInfo;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1.5fr 28px 28px;
    align-items: center;
    gap: ${gapS};
    width: 650px;
`;

export const MembershipUserListItemEditable = ({ membership }: MembershipUserListItemEditableProps) => {
    const { supplementalPositions } = membership.user;
    const mainPosition = useMemo(() => {
        const { positions } = getLastSupplementalPositions(supplementalPositions);

        return positions.find((item) => item.main);
    }, [supplementalPositions]);

    return (
        <StyledRow>
            <UserListItem user={membership.user} />
            <Text size="xs" color={gray9}>
                {nullable(mainPosition, (v) => `${getOrgUnitTitle(v.organizationUnit)}: `)}
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
