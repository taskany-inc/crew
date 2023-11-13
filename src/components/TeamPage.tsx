import styled from 'styled-components';
import { TreeView, nullable } from '@taskany/bricks';
import { gapL, gapM } from '@taskany/colors';

import { trpc } from '../trpc/trpcClient';

import { LayoutMain } from './LayoutMain';
import { GroupTreeViewNode } from './GroupTreeViewNode';
import { CommonHeader } from './CommonHeader';
import { tr } from './components.i18n';

const StyledTreeContainer = styled.div`
    margin: ${gapM} ${gapL} 0 ${gapL};
`;

type TeamPageProps = {
    teamId: string;
};

export const TeamPage = ({ teamId }: TeamPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    const group = groupQuery.data;

    const childrenQuery = trpc.group.getChildren.useQuery(teamId);
    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <CommonHeader title={tr('Team')} description={tr('All active children teams')} />

            <StyledTreeContainer>
                <TreeView>
                    {nullable(childrenQuery.data, (children) =>
                        children.map((child) => <GroupTreeViewNode key={child.id} group={child} visible />),
                    )}
                </TreeView>
            </StyledTreeContainer>
        </LayoutMain>
    );
};
