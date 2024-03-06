import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { useSession } from 'next-auth/react';
import { UserRole } from 'prisma/prisma-client';

import { MembershipInfo } from '../modules/userTypes';

import { MembershipGroupListItem } from './MembershipGroupListItem/MembershipGroupListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';

export interface MembershipGroupListItemEditableProps {
    membership: MembershipInfo;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px 28px;
`;

export const MembershipGroupListItemEditable = ({ membership }: MembershipGroupListItemEditableProps) => {
    const session = useSession();
    const user = session.data?.user;

    return (
        <StyledRow>
            <MembershipGroupListItem membership={membership} />

            <Text size="s" color={gray9}>
                {membership.percentage}
            </Text>

            {user?.role === UserRole.ADMIN && <MembershipEditMenu membership={membership} />}
        </StyledRow>
    );
};
