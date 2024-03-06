import { Group } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import styled from 'styled-components';

import { NarrowSection } from '../NarrowSection';
import { useGroupMutations } from '../../modules/groupHooks';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';
import { GroupListItem } from '../GroupListItem';
import { Restricted } from '../Restricted';

import { tr } from './TeamChildren.i18n';

const StyledChildrenList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

interface GroupTeamsProps {
    groupId: string;
    groupChildren: Group[];
    isEditable: boolean;
}

export const TeamChildren = ({ groupId, groupChildren, isEditable }: GroupTeamsProps) => {
    const { moveGroup } = useGroupMutations();

    const onSubmit = async (group: Group) => {
        await moveGroup({ id: group.id, newParentId: groupId });
    };

    return (
        <NarrowSection title={tr('Teams')}>
            <StyledChildrenList>
                {groupChildren.map((group) => (
                    <GroupListItem key={group.id} groupId={group.id} groupName={group.name} />
                ))}
            </StyledChildrenList>

            <Restricted visible={isEditable}>
                <InlineGroupSelectForm triggerText={tr('Add team')} actionText={tr('Add')} onSubmit={onSubmit} />
            </Restricted>
        </NarrowSection>
    );
};
