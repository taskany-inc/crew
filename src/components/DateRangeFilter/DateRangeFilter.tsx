import { FilterTabLabel, Tab, Input, nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';

import { stripTimezone } from '../../utils/dateTime';

import s from './DateRangeFilter.module.css';
import { tr } from './DateRangeFilter.i18n';

interface DateRangeFilterProps {
    defaultFrom?: string;
    defaultTo?: string;
    setFrom: (date?: string) => void;
    setTo: (date?: string) => void;
    warningMessage?: string;
}

export const DateRangeFilter = ({ defaultFrom, defaultTo, setFrom, setTo, warningMessage }: DateRangeFilterProps) => {
    return (
        <>
            <Tab name="date-range" label={<FilterTabLabel text={tr('Date range')} />}>
                <div className={s.RangeContainer}>
                    <Text>{tr('From')}:</Text>
                    <Input
                        type="date"
                        defaultValue={stripTimezone(defaultFrom)}
                        onChange={(e) => setFrom(e.target.valueAsDate?.toISOString())}
                    />
                    <Text>{tr('To')}:</Text>
                    <Input
                        type="date"
                        defaultValue={stripTimezone(defaultTo)}
                        onChange={(e) => setTo(e.target.valueAsDate?.toISOString())}
                    />
                    {nullable(warningMessage, (m) => (
                        <Text size="s" className={s.Warning}>
                            {m}
                        </Text>
                    ))}
                </div>
            </Tab>
        </>
    );
};
