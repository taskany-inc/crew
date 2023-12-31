import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text, TreeViewNode } from '@taskany/bricks';
import { gapS, gapXs, gray4, gray6, radiusM } from '@taskany/colors';

import { trpc } from '../trpc/trpcClient';
import { usePreviewContext } from '../contexts/previewContext';
import { pages } from '../hooks/useRouter';

import { Link } from './Link';

const StyledGroupLink = styled(Link)`
    width: 100%;
`;

const StyledGroupRow = styled.div`
    cursor: pointer;
    background-color: ${gray4};
    padding: ${gapS};
    border-radius: ${radiusM};

    &:hover {
        background-color: ${gray6};
    }
`;

const GroupRow = ({ group }: { group: Group }) => {
    const { showGroupPreview } = usePreviewContext();
    return (
        <StyledGroupLink onClick={() => showGroupPreview(group.id)} href={pages.team(group.id)}>
            <StyledGroupRow>
                <Text size="l">{group.name}</Text>
            </StyledGroupRow>
        </StyledGroupLink>
    );
};

interface GroupTreeViewNodeProps {
    group: Group;
    visible?: boolean;
}

const StyledTreeViewNodeContainer = styled.div`
    margin: ${gapXs} 0;
`;

export const GroupTreeViewNode = ({ group, visible }: GroupTreeViewNodeProps) => {
    const childrenQuery = trpc.group.getChildren.useQuery(group.id);
    const childrenData = childrenQuery.data ?? [];

    return (
        <StyledTreeViewNodeContainer>
            <TreeViewNode title={<GroupRow group={group} />} visible={visible}>
                {childrenData.map((child) => (
                    <GroupTreeViewNode key={child.id} group={child} />
                ))}
            </TreeViewNode>
        </StyledTreeViewNodeContainer>
    );
};
