import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapL, gapM, gapS, gray9 } from '@taskany/colors';
import { Text } from '@taskany/bricks';
import { IconPlusCircleOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';
import { UserListItem } from '../UserListItem';

const StyledUsers = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapS};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledPageSep = styled(PageSep)`
    white-space: nowrap;
    margin: 5px 0px;
    width: 300px;
`;

type TeamPeopleProps = {
    users: User[];
};

export const TeamPeople = ({ users }: TeamPeopleProps) => {
    return (
        <StyledUsers>
            <Text color={gray9} size="m" weight="bold">
                People
                <StyledPageSep />
            </Text>

            {users.map((user) => (
                <UserListItem key={user.id} user={user} />
            ))}

            <InlineTrigger
                icon={<IconPlusCircleOutline noWrap size="s" />}
                text={'Add participant'}
                onClick={() => {}}
            />
        </StyledUsers>
    );
};
