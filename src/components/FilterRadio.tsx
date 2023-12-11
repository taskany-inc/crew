import { AutoCompleteRadioGroup, FilterTabLabel, Tab } from '@taskany/bricks';
import { useMemo } from 'react';

interface FilterRadioProps {
    tabName: string;
    label: string;
    items: React.ComponentProps<typeof AutoCompleteRadioGroup>['items'];
    onChange: (value: string) => void;
    value?: string;
}

export const FilterRadio = ({ tabName, label, value, items, onChange }: FilterRadioProps) => {
    const selected = useMemo(
        () => (value ? items.filter((item) => item.value === value).map(({ title }) => title) : []),
        [value, items],
    );
    return (
        <Tab name={tabName} label={<FilterTabLabel text={label} selected={selected} />}>
            <AutoCompleteRadioGroup
                title={label}
                items={items}
                name={label}
                onChange={(val) => onChange(val.value)}
                value={value}
            />
        </Tab>
    );
};
