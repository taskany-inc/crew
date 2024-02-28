import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconUsersOutline } from '@taskany/icons';

import { usePreviewContext } from '../contexts/previewContext';
import { pages } from '../hooks/useRouter';

import { Link } from './Link';

interface GroupListItemProps {
    groupId: string;
    groupName: string;
}

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    flex-wrap: nowrap;
`;

export const GroupListItem = ({ groupId, groupName }: GroupListItemProps) => {
    const { showGroupPreview } = usePreviewContext();
    return (
        <StyledWrapper>
            <IconUsersOutline size="s" color={gray9} />
            <Text>
                <Link onClick={() => showGroupPreview(groupId)} href={pages.team(groupId)}>
                    {groupName}
                </Link>
            </Text>
        </StyledWrapper>
    );
};
