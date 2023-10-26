import { useMemo, useState } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { MembershipInfo } from '../../modules/userTypes';
import { EditRolesModal } from '../EditRolesModal/EditRolesModal';
import { RemoveUserFromGroupModal } from '../RemoveUserFromGroupModal/RemoveUserFromGroupModal';

import { tr } from './MembershipEditMenu.i18n';

type MembershipEditMenuProps = {
    membership: MembershipInfo;
};

export const MembershipEditMenu = ({ membership }: MembershipEditMenuProps) => {
    const [editRolesModalVisible, setEditRolesModalVisible] = useState(false);
    const [removeModalVisible, setRemoveModalVisible] = useState(false);

    const items = useMemo(
        () => [
            { name: tr('Edit roles'), action: () => setEditRolesModalVisible(true) },
            { name: tr('Remove'), action: () => setRemoveModalVisible(true) },
        ],
        [],
    );

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

            <EditRolesModal
                visible={editRolesModalVisible}
                membership={membership}
                onClose={() => setEditRolesModalVisible(false)}
            />

            <RemoveUserFromGroupModal
                visible={removeModalVisible}
                membership={membership}
                onClose={() => setRemoveModalVisible(false)}
            />
        </>
    );
};
