import styled from 'styled-components';
import { TreeView, nullable } from '@taskany/bricks';
import { gapL, gapM } from '@taskany/colors';

import { trpc } from '../trpc/trpcClient';

import { LayoutMain } from './LayoutMain/LayoutMain';
import { GroupTreeViewNode } from './GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from './TeamPageHeader/TeamPageHeader';
import { PageSep } from './PageSep';
import { TeamVacancies } from './TeamVacancies/TeamVacancies';
import { TeamPeople } from './TeamPeople/TeamPeople';

const StyledTreeContainer = styled.div`
    margin: ${gapM} ${gapL} 0 ${gapL};
`;

interface TeamPageProps {
    teamId: string;
}

export const StyledWrapper = styled.div`
    padding-top: ${gapM};
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;

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
                        children.map((child) => <GroupTreeViewNode key={child.id} group={child} />),
                    )}
                </TreeView>
                <StyledWrapper>
                    {nullable(groupQuery.data, (g) => (
                        <>
                            <TeamPeople groupId={g.id} isEditable={g.meta.isEditable} />
                            <TeamVacancies group={g} />
                        </>
                    ))}
                </StyledWrapper>
            </StyledTreeContainer>
        </LayoutMain>
    );
};
