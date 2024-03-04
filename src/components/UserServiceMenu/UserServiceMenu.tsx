import { useMemo, useState } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { DeleteUserServiceModal } from '../DeleteUserServiceModal/DeleteUserServiceModal';
import { UserServiceInfo } from '../../modules/serviceTypes';

import { tr } from './UserServiceMenu.i18n';

interface UserServiceMenuProps {
    service: UserServiceInfo;
}

export const UserServiceMenu = ({ service }: UserServiceMenuProps) => {
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
            <DeleteUserServiceModal
                visible={removeModalVisible}
                onClose={() => setRemoveModalVisible(false)}
                userService={service}
            />
        </>
    );
};
