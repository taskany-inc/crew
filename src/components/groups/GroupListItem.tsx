import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconUsersOutline } from '@taskany/icons';

import { usePreviewContext } from '../../context/preview-context';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';

type GroupListItemProps = {
    group: Group;
};

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

export const GroupListItem = ({ group }: GroupListItemProps) => {
    const { showGroupPreview } = usePreviewContext();
    return (
        <StyledWrapper>
            <IconUsersOutline size={13} color={gray9} />
            <Text>
                <Link onClick={() => showGroupPreview(group.id)} href={pages.team(group.name)}>
                    {group.name}
                </Link>
            </Text>
        </StyledWrapper>
    );
};
