import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconUsersOutline } from '@taskany/icons';

import { pages } from '../hooks/useRouter';

import { Link } from './Link';

type GroupListItemProps = {
    group: Group;
};

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

export const GroupListItem = ({ group }: GroupListItemProps) => {
    return (
        <StyledWrapper>
            <IconUsersOutline size={13} color={gray9} />
            <Text>
                <Link href={pages.team(group.id)}>{group.name}</Link>
            </Text>
        </StyledWrapper>
    );
};
