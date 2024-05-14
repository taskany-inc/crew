import { useMemo, useState } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { RemoveUserFromGroupAdmins } from '../RemoveUserFromGroupAdmins/RemoveUserFromGroupAdmins';
import { GroupAdminInfo } from '../../modules/groupTypes';

import { tr } from './GroupAdminMenu.i18n';

interface GroupAdminMenuProps {
    admin: GroupAdminInfo;
}

export const GroupAdminMenu = ({ admin }: GroupAdminMenuProps) => {
    const [removeModalVisible, setRemoveModalVisible] = useState(false);

    const items = useMemo(() => [{ name: tr('Delete'), action: () => setRemoveModalVisible(true) }], []);

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
            <RemoveUserFromGroupAdmins
                visible={removeModalVisible}
                onClose={() => setRemoveModalVisible(false)}
                admin={admin}
            />
        </>
    );
};
