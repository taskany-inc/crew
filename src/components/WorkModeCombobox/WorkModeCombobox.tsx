import { nullable } from '@taskany/bricks';
import { Select, SelectPanel, SelectTrigger, Text } from '@taskany/bricks/harmony';

import { Nullish } from '../../utils/types';

import { tr } from './WorkModeCombobox.i18n';

interface WorkModeComboboxProps {
    value?: Nullish<string>;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];
    className?: string;
}

export const WorkModeCombobox = ({ value, onChange, className, error }: WorkModeComboboxProps) => {
    const workModeItems = [tr('Office'), tr('Mixed'), tr('Remote')];

    return (
        <Select
            arrow
            value={value ? [{ id: value }] : undefined}
            items={workModeItems.map((i) => ({ id: i }))}
            onChange={(items) => onChange(items[0].id)}
            selectable
            mode="single"
            renderItem={(props) => (
                <Text key={props.item.id} size="s" ellipsis>
                    {props.item.id}
                </Text>
            )}
        >
            <SelectTrigger
                size="m"
                error={error}
                placeholder={tr('Choose work mode')}
                view="outline"
                className={className}
            >
                {nullable(value, (mode) => mode)}
            </SelectTrigger>
            <SelectPanel placement="bottom-start" />
        </Select>
    );
};
