import { Group } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import styled from 'styled-components';

import { NarrowSection } from '../NarrowSection';
import { useGroupMutations } from '../../modules/groupHooks';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';
import { GroupListItemEditable } from '../GroupListItemEditable';

import { tr } from './TeamChildren.i18n';

const StyledChildrenList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type GroupTeamsProps = {
    groupId: string;
    groupChildren: Group[];
};

export const TeamChildren = ({ groupId, groupChildren }: GroupTeamsProps) => {
    const { moveGroup } = useGroupMutations();

    const onSubmit = async (group: Group) => {
        await moveGroup({ id: group.id, newParentId: groupId });
    };

    return (
        <NarrowSection title={tr('Teams')}>
            <StyledChildrenList>
                {groupChildren.map((group) => (
                    <GroupListItemEditable key={group.id} groupName={group.name} groupId={group.id} />
                ))}
            </StyledChildrenList>

            <InlineGroupSelectForm triggerText={tr('Add team')} actionText={tr('Add')} onSubmit={onSubmit} />
        </NarrowSection>
    );
};
