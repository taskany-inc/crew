import { useMemo } from 'react';
import styled from 'styled-components';
import { Vacancy } from 'prisma/prisma-client';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { VacancyListItem } from './VacancyListItem';

type VacancyListItemEditableProps = {
    vacancy: Vacancy;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
    width: 600px;
`;

export const VacancyListItemEditable = ({ vacancy }: VacancyListItemEditableProps) => {
    const items = useMemo(() => [], []);

    return (
        <StyledRow>
            <VacancyListItem vacancy={vacancy} />

            {/* TODO make it editable in https://github.com/taskany-inc/crew/issues/471 */}

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
