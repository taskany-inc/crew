import { useMemo } from 'react';
import styled from 'styled-components';
import { Vacancy } from '@prisma/client';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { VacancyListItem } from '../VacancyListItem';
import { ArchiveVacancyModal } from '../ArchiveVacancyModal/ArchiveVacancyModal';
import { useBoolean } from '../../hooks/useBoolean';
import { VacancyHr, VacancyHiringManager } from '../../modules/vacancyTypes';
import { UpdateVacancyModal } from '../UpdateVacancyModal/UpdateVacancyModal';
import { Restricted } from '../Restricted';

import { tr } from './VacancyListItemEditable.i18n';

interface VacancyListItemEditableProps {
    vacancy: Vacancy & VacancyHr & VacancyHiringManager;
    groupName: string;
    isEditable: boolean;
}

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px;
    width: 600px;
`;

export const VacancyListItemEditable = ({ vacancy, groupName, isEditable }: VacancyListItemEditableProps) => {
    const editVacancyModalVisibility = useBoolean(false);
    const archiveVacancyModalVisibility = useBoolean(false);

    const items = useMemo(
        () => [
            { name: tr('Edit vacancy'), action: () => editVacancyModalVisibility.setTrue() },
            { name: tr('Archive'), action: () => archiveVacancyModalVisibility.setTrue() },
        ],
        [archiveVacancyModalVisibility, editVacancyModalVisibility],
    );

    return (
        <StyledRow>
            <VacancyListItem vacancy={vacancy} />

            <Restricted visible={isEditable}>
                <Dropdown
                    onChange={(v) => v.action()}
                    items={items}
                    renderTrigger={({ ref, onClick }) => (
                        <IconMoreVerticalOutline ref={ref} size="xs" onClick={onClick} />
                    )}
                    renderItem={({ item, cursor, index, onClick }) => (
                        <MenuItem key={item.name} ghost focused={cursor === index} onClick={onClick}>
                            {item.name}
                        </MenuItem>
                    )}
                />
            </Restricted>

            <UpdateVacancyModal
                visible={editVacancyModalVisibility.value}
                vacancy={vacancy}
                groupName={groupName}
                onClose={editVacancyModalVisibility.setFalse}
            />

            <ArchiveVacancyModal
                visible={archiveVacancyModalVisibility.value}
                vacancy={vacancy}
                onClose={archiveVacancyModalVisibility.setFalse}
            />
        </StyledRow>
    );
};
