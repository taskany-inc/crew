import { useMemo, useState } from 'react';
import { Dropdown, MenuItem, useCopyToClipboard } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { DeleteUserDeviceModal } from '../DeleteUserDeviceModal/DeleteUserDeviceModal';
import { UserDeviceInfo } from '../../modules/deviceTypes';
import { notifyPromise } from '../../utils/notifications/notifyPromise';

import { tr } from './UserDeviceMenu.i18n';

interface UserDeviceMenuProps {
    device: UserDeviceInfo;
}

export const UserDeviceMenu = ({ device }: UserDeviceMenuProps) => {
    const [removeModalVisible, setRemoveModalVisible] = useState(false);
    const [, copy] = useCopyToClipboard();

    const items = useMemo(() => {
        return [
            { name: tr('Delete'), action: () => setRemoveModalVisible(true) },
            { name: tr('Copy device name'), action: () => notifyPromise(copy(device.deviceName), 'copy') },
            { name: tr('Copy device id'), action: () => notifyPromise(copy(device.deviceId), 'copy') },
        ];
    }, [copy, device]);

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
            <DeleteUserDeviceModal
                visible={removeModalVisible}
                device={device}
                onClose={() => setRemoveModalVisible(false)}
            />
        </>
    );
};
