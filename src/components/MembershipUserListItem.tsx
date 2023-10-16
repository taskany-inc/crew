import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Dropdown, MenuItem, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { MembershipInfo } from '../modules/user.types';

import { UserListItem } from './UserListItem';
import { tr } from './groups/groups.i18n';
import { EditRolesModal } from './groups/EditRolesModal';
import { RemoveUserFromGroupModal } from './groups/RemoveUserFromGroupModal';

type MembershipUserListItemProps = {
    membership: MembershipInfo;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr 28px;
    gap: ${gapS};
    width: 600px;
`;

export const MembershipUserListItem = ({ membership }: MembershipUserListItemProps) => {
    const [editRolesPopupVisible, setEditRolesPopupVisible] = useState(false);
    const [removePopupVisible, setRemovePopupVisible] = useState(false);

    const items = useMemo(
        () => [
            { name: tr('Edit roles'), action: () => setEditRolesPopupVisible(true) },
            { name: tr('Remove'), action: () => setRemovePopupVisible(true) },
        ],
        [],
    );

    return (
        <StyledRow>
            <UserListItem user={membership.user} />
            <Text size="xs" color={gray9}>
                {membership.roles.map((role) => role.name).join(', ')}
            </Text>

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
                visible={editRolesPopupVisible}
                membership={membership}
                onClose={() => setEditRolesPopupVisible(false)}
            />

            <RemoveUserFromGroupModal
                visible={removePopupVisible}
                membership={membership}
                onClose={() => setRemovePopupVisible(false)}
            />
        </StyledRow>
    );
};
