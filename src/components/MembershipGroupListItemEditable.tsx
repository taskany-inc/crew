import styled from 'styled-components';

import { MembershipInfo } from '../modules/userTypes';

import { MembershipGroupListItem } from './MembershipGroupListItem/MembershipGroupListItem';
import { MembershipEditMenu } from './MembershipEditMenu/MembershipEditMenu';

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
