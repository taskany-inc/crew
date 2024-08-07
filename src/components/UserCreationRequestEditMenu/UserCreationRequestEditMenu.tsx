import { useMemo } from 'react';
import { IconMoreVerticalOutline } from '@taskany/icons';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { useBoolean } from '../../hooks/useBoolean';
import { UserRequest } from '../../trpc/inferredTypes';
import { EditUserCreationRequestModal } from '../EditUserCreationRequestModal/EditUserCreationRequestModal';
import { CancelUserCreationRequestModal } from '../CancelUserCreationRequestModal/CancelUserCreationRequestModal';

import { tr } from './UserCreationRequestEditMenu.i18n';

interface UserCreationRequestEditMenuProps {
    request: UserRequest;
}

export const UserCreationRequestEditMenu = ({ request }: UserCreationRequestEditMenuProps) => {
    const editUserCreationRequestVisible = useBoolean(false);
    const cancelUserCreationRequestVisible = useBoolean(false);

    const items = useMemo(
        () => [
            { name: tr('Edit user creation request'), action: () => editUserCreationRequestVisible.setTrue() },
            { name: tr('Cancel user creation request'), action: () => cancelUserCreationRequestVisible.setTrue() },
        ],
        [editUserCreationRequestVisible, cancelUserCreationRequestVisible],
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

            <EditUserCreationRequestModal
                request={request}
                visible={editUserCreationRequestVisible.value}
                onClose={editUserCreationRequestVisible.setFalse}
            />
            <CancelUserCreationRequestModal
                request={request}
                visible={cancelUserCreationRequestVisible.value}
                onClose={cancelUserCreationRequestVisible.setFalse}
            />
        </>
    );
};
