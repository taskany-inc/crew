import { AppliedFilter, Input, TagCleanButton } from '@taskany/bricks/harmony';
import { ChangeEvent } from 'react';

import { stripTimezone } from '../../utils/dateTime';

interface AppliedDateFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedDate: string[] | undefined;
    onChange: (date: string[]) => void;
    onClose: () => void;
}

export const AppliedDateFilter = ({
    label,
    onCleanFilter,
    selectedDate,
    onChange,
    onClose,
}: AppliedDateFilterProps) => {
    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        onChange([e.target.valueAsDate?.toISOString() as string]);
        onClose();
    };

    return (
        <AppliedFilter label={label} action={<TagCleanButton size="s" onClick={onCleanFilter} />}>
            <Input type="date" defaultValue={stripTimezone(selectedDate?.[0])} onChange={changeHandler} />
        </AppliedFilter>
    );
};
