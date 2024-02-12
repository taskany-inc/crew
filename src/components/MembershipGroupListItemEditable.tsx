import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';

import { MembershipInfo } from '../modules/userTypes';

import { MembershipGroupListItem } from './MembershipGroupListItem/MembershipGroupListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';

export type MembershipGroupListItemEditableProps = {
    membership: MembershipInfo;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px 28px;
`;

export const MembershipGroupListItemEditable = ({ membership }: MembershipGroupListItemEditableProps) => {
    return (
        <StyledRow>
            <MembershipGroupListItem membership={membership} />

            <Text size="s" color={gray9}>
                {membership.percentage}
            </Text>

            <MembershipEditMenu membership={membership} />
        </StyledRow>
    );
};
