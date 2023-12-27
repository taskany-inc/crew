import styled from 'styled-components';
import { TreeView, nullable } from '@taskany/bricks';
import { gapL, gapM } from '@taskany/colors';

import { trpc } from '../trpc/trpcClient';

import { LayoutMain } from './LayoutMain';
import { GroupTreeViewNode } from './GroupTreeViewNode';
import { TeamPageHeader } from './TeamPageHeader/TeamPageHeader';
import { PageSep } from './PageSep';

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
            <TeamPageHeader group={group} />

            <PageSep />

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
