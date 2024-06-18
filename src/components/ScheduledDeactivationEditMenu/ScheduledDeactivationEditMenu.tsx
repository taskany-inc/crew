import { useMemo } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { ScheduledDeactivation } from '@prisma/client';
import { IconMoreVerticalOutline } from '@taskany/icons';
import styled from 'styled-components';

import { useBoolean } from '../../hooks/useBoolean';
import { CancelScheduleDeactivation } from '../CancelScheduleDeactivation/CancelScheduleDeactivation';
import { ScheduleDeactivationForm } from '../ScheduleDeactivationForm/ScheduleDeactivationForm';
import {
    ScheduledDeactivationAttaches,
    ScheduledDeactivationCreator,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationOrganizationUnit,
    ScheduledDeactivationUser,
} from '../../modules/scheduledDeactivationTypes';

import { tr } from './ScheduledDeactivationEditMenu.i18n';

interface ScheduledDeactivationEditMenuProps {
    scheduledDeactivation: ScheduledDeactivation &
        ScheduledDeactivationCreator &
        ScheduledDeactivationUser &
        ScheduledDeactivationOrganizationUnit &
        ScheduledDeactivationNewOrganizationUnit &
        ScheduledDeactivationAttaches;
}

const StyledIconMoreVerticalOutline = styled(IconMoreVerticalOutline)`
    cursor: pointer;
`;

export const ScheduledDeactivationEditMenu = ({ scheduledDeactivation }: ScheduledDeactivationEditMenuProps) => {
    const editScheduledDeactivationVisible = useBoolean(false);
    const cancelScheduledDeactivationVisible = useBoolean(false);

    const items = useMemo(
        () => [
            { name: tr('Edit scheduled deactivation'), action: () => editScheduledDeactivationVisible.setTrue() },
            { name: tr('Cancel'), action: () => cancelScheduledDeactivationVisible.setTrue() },
        ],
        [],
    );

    return (
        <>
            <Dropdown
                onChange={(v) => v.action()}
                items={items}
                renderTrigger={({ ref, onClick }) => (
                    <StyledIconMoreVerticalOutline ref={ref} size="xs" onClick={onClick} />
                )}
                renderItem={({ item, cursor, index, onClick }) => (
                    <MenuItem key={item.name} ghost focused={cursor === index} onClick={onClick}>
                        {item.name}
                    </MenuItem>
                )}
            />

            <ScheduleDeactivationForm
                userId={scheduledDeactivation.user.id}
                visible={editScheduledDeactivationVisible.value}
                scheduledDeactivation={scheduledDeactivation}
                onClose={editScheduledDeactivationVisible.setFalse}
            />

            <CancelScheduleDeactivation
                visible={cancelScheduledDeactivationVisible.value}
                scheduledDeactivation={scheduledDeactivation}
                onClose={cancelScheduledDeactivationVisible.setFalse}
            />
        </>
    );
};
