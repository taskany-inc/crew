import { useMemo, useState } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { MembershipInfo } from '../../modules/userTypes';
import { AddUserToTeamModal } from '../AddUserToTeamModal/AddUserToTeamModal';
import { WarningModal } from '../WarningModal/WarningModal';
import { useUserMutations } from '../../modules/userHooks';

import { tr } from './MembershipEditMenu.i18n';

interface MembershipEditMenuProps {
    membership: MembershipInfo;
}

export const MembershipEditMenu = ({ membership }: MembershipEditMenuProps) => {
    const [editRolesModalVisible, setEditRolesModalVisible] = useState(false);
    const [removeModalVisible, setRemoveModalVisible] = useState(false);

    const { removeUserFromGroup } = useUserMutations();

    const items = useMemo(
        () => [
            { name: tr('Edit'), action: () => setEditRolesModalVisible(true) },
            { name: tr('Remove'), action: () => setRemoveModalVisible(true) },
        ],
        [],
    );

    const onRemoveClick = async (membership: MembershipInfo) => {
        await removeUserFromGroup({ userId: membership.userId, groupId: membership.groupId });
        setRemoveModalVisible(false);
    };

    return (
        <>
            <Dropdown
                onChange={(v) => v.action()}
                items={items}
                renderTrigger={({ ref, onClick }) => <IconMoreVerticalOutline ref={ref} size="xs" onClick={onClick} />}
                renderItem={({ item, cursor, index, onClick }) => (
                    <MenuItem key={item.name} ghost focused={cursor === index} onClick={onClick}>
                        {item.name}
                    </MenuItem>
                )}
            />

            <AddUserToTeamModal
                membership={membership}
                visible={editRolesModalVisible}
                onClose={() => setEditRolesModalVisible(false)}
                groupId={membership.groupId}
                type="edit"
            />

            <WarningModal
                view="danger"
                warningText={tr('Do you really want to remove a member {user} from the team {team}', {
                    user: membership.user.name || membership.user.email,
                    team: membership.group.name,
                })}
                visible={removeModalVisible}
                onCancel={() => setRemoveModalVisible(false)}
                onConfirm={() => onRemoveClick(membership)}
            />
        </>
    );
};
