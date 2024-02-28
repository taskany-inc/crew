import { useMemo } from 'react';
import styled from 'styled-components';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { GroupListItem } from './GroupListItem';

interface GroupListItemEditableProps {
    groupId: string;
    groupName: string;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
    width: 600px;
`;

export const GroupListItemEditable = ({ groupId, groupName }: GroupListItemEditableProps) => {
    const items = useMemo(() => [], []);

    return (
        <StyledRow>
            <GroupListItem groupId={groupId} groupName={groupName} />

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
        </StyledRow>
    );
};
