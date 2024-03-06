import styled from 'styled-components';
import { Group } from 'prisma/prisma-client';
import { Text } from '@taskany/bricks';
import { IconUsersOutline } from '@taskany/icons';
import { gapS } from '@taskany/colors';

import { usePreviewContext } from '../contexts/previewContext';
import { pages } from '../hooks/useRouter';

import { Link } from './Link';

interface GroupBreadcrumbListItemProps {
    breadcrumb: Group;
}

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    flex-wrap: nowrap;
    margin: ${gapS};
`;

export const GroupBreadcrumbListItem = ({ breadcrumb }: GroupBreadcrumbListItemProps) => {
    const { showGroupPreview } = usePreviewContext();

    return (
        <StyledWrapper>
            {/* TODO: replace with supervisor user pic https://github.com/taskany-inc/crew/issues/273 */}
            <IconUsersOutline size="s" />
            <Text>
                <Link onClick={() => showGroupPreview(breadcrumb.id)} href={pages.team(breadcrumb.id)}>
                    {breadcrumb.name}
                </Link>
            </Text>
        </StyledWrapper>
    );
};
