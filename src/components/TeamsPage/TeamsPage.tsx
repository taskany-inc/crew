import styled from 'styled-components';
import { TreeView } from '@taskany/bricks';
import { gapL, gapM } from '@taskany/colors';

import { LayoutMain } from '../LayoutMain/LayoutMain';
import { trpc } from '../../trpc/trpcClient';
import { GroupTreeViewNode } from '../GroupTreeViewNode';
import { CommonHeader } from '../CommonHeader';

import { tr } from './TeamsPage.i18n';

const StyledTreeContainer = styled.div`
    margin: ${gapM} ${gapL} 0 ${gapL};
`;

export const TeamsPage = () => {
    const rootsQuery = trpc.group.getRoots.useQuery();
    const rootsData = rootsQuery.data ?? [];

    return (
        <LayoutMain pageTitle={tr('Teams')}>
            <CommonHeader title={tr('Teams')} description={tr('All active teams')} />

            <StyledTreeContainer>
                <TreeView>
                    {rootsData.map((g) => (
                        <GroupTreeViewNode key={g.id} group={g} visible />
                    ))}
                </TreeView>
            </StyledTreeContainer>
        </LayoutMain>
    );
};
