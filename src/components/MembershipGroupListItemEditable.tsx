import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { MembershipInfo } from '../modules/user.types';

import { tr } from './components.i18n';
import { MembershipGroupListItem } from './MembershipGroupListItem';
import { RemoveUserFromGroupModal } from './groups/RemoveUserFromGroupModal';

export type MembershipGroupListItemEditableProps = {
    membership: MembershipInfo;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
    width: 600px;
`;

export const MembershipGroupListItemEditable = ({ membership }: MembershipGroupListItemEditableProps) => {
    const [removePopupVisible, setRemovePopupVisible] = useState(false);

    const items = useMemo(() => [{ name: tr('Remove'), action: () => setRemovePopupVisible(true) }], []);

    return (
        <StyledRow>
            <MembershipGroupListItem membership={membership} />

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

            <RemoveUserFromGroupModal
                visible={removePopupVisible}
                membership={membership}
                onClose={() => setRemovePopupVisible(false)}
            />
        </StyledRow>
    );
};
