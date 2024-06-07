import { Group } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import styled from 'styled-components';
import { IconPlusCircleSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { GroupListItem } from '../GroupListItem';
import { Restricted } from '../Restricted';
import { useBoolean } from '../../hooks/useBoolean';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { InlineTrigger } from '../InlineTrigger';

import { tr } from './TeamChildren.i18n';

const StyledChildrenList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

interface GroupTeamsProps {
    group: Group;
    groupChildren: Group[];
    isEditable: boolean;
}

export const TeamChildren = ({ group, groupChildren, isEditable }: GroupTeamsProps) => {
    const createGroupModalVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Teams')}>
            <StyledChildrenList>
                {groupChildren.map((g) => (
                    <GroupListItem key={g.id} groupId={g.id} groupName={g.name} />
                ))}
            </StyledChildrenList>

            <Restricted visible={isEditable}>
                <InlineTrigger
                    text={tr('Add team')}
                    icon={<IconPlusCircleSolid size="s" />}
                    onClick={createGroupModalVisibility.setTrue}
                />
            </Restricted>
            <CreateGroupModal
                visible={createGroupModalVisibility.value}
                onClose={createGroupModalVisibility.setFalse}
                parent={group}
            />
        </NarrowSection>
    );
};
