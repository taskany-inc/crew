import { useMemo } from 'react';
import styled from 'styled-components';
import { Group } from 'prisma/prisma-client';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { GroupListItem } from './GroupListItem';

type GroupListItemEditableProps = {
    group: Group;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
    width: 600px;
`;

export const GroupListItemEditable = ({ group }: GroupListItemEditableProps) => {
    const items = useMemo(() => [], []);

    return (
        <StyledRow>
            <GroupListItem group={group} />

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
