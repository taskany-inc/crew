import { Group } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import styled from 'styled-components';
import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { GroupListItem } from '../GroupListItem';
import { NarrowSection } from '../NarrowSection';

import { tr } from './groups.i18n';

const StyledChildrenList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type GroupTeamsProps = {
    groupChildren: Group[];
};

export const TeamChildren = ({ groupChildren }: GroupTeamsProps) => {
    return (
        <NarrowSection title={tr('Teams')}>
            <StyledChildrenList>
                {groupChildren.map((group) => (
                    <GroupListItem key={group.id} group={group} />
                ))}
            </StyledChildrenList>

            {/* TODO: Link to add to the teams */}
            <InlineTrigger icon={<IconPlusCircleOutline noWrap size="xs" />} text={'Add teams'} disabled />
        </NarrowSection>
    );
};
