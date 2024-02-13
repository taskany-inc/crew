import { useState } from 'react';
import { VacancyStatus } from 'prisma/prisma-client';
import { gray9 } from '@taskany/colors';
import { IconStampOutline } from '@taskany/icons';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';

import { Nullish } from '../../utils/types';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './VacancyStatusComboBox.i18n';

export interface VacancyStatusObject {
    id: VacancyStatus;
    name: string;
}

export const statusesMap: Record<VacancyStatus, VacancyStatusObject> = {
    ACTIVE: { id: VacancyStatus.ACTIVE, name: tr('Active') },
    ON_HOLD: { id: VacancyStatus.ON_HOLD, name: tr('Paused') },
    CLOSED: { id: VacancyStatus.CLOSED, name: tr('Closed') },
    ON_CONFIRMATION: { id: VacancyStatus.ON_CONFIRMATION, name: tr('On confirmation') },
};

const statuses: VacancyStatusObject[] = [
    { id: VacancyStatus.ACTIVE, name: tr('Active') },
    { id: VacancyStatus.ON_HOLD, name: tr('Paused') },
    { id: VacancyStatus.CLOSED, name: tr('Closed') },
    { id: VacancyStatus.ON_CONFIRMATION, name: tr('On confirmation') },
];

interface VacancyStatusBoxProps {
    status?: Nullish<VacancyStatusObject>;
    onChange: (role: Nullish<VacancyStatusObject>) => void;
}

export const VacancyStatusComboBox = ({ status, onChange }: VacancyStatusBoxProps) => {
    const suggestionsVisibility = useBoolean(false);

    const [selectedStatus, setSelectedStatus] = useState<Nullish<VacancyStatusObject>>(status);

    return (
        <ComboBox
            onChange={(value) => {
                suggestionsVisibility.setFalse();
                setSelectedStatus(value);
                onChange(value);
            }}
            value={selectedStatus?.name}
            onFocus={() => suggestionsVisibility.setTrue()}
            visible={suggestionsVisibility.value}
            items={statuses}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedStatus, () => (
                        <IconStampOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose status')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onBlur={suggestionsVisibility.setFalse}
                    {...props}
                />
            )}
            onClickOutside={(cb) => cb()}
            onClose={suggestionsVisibility.setFalse}
            renderItem={(props) => (
                <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                    <Text size="s" ellipsis>
                        {props.item.name}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
