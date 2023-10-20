import styled from 'styled-components';

import { MembershipInfo } from '../modules/user.types';

import { MembershipGroupListItem } from './MembershipGroupListItem';
import { MembershipEditMenu } from './MembershipEditMenu';

export type MembershipGroupListItemEditableProps = {
    membership: MembershipInfo;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
`;

export const MembershipGroupListItemEditable = ({ membership }: MembershipGroupListItemEditableProps) => {
    return (
        <StyledRow>
            <MembershipGroupListItem membership={membership} />

            <MembershipEditMenu membership={membership} />
        </StyledRow>
    );
};
