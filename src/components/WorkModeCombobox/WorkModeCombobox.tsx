import { useMemo, useState } from 'react';
import { ComboBox, FormInput, Input, MenuItem, Text } from '@taskany/bricks';

import { Nullish } from '../../utils/types';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './WorkModeCombobox.i18n';

interface WorkModeComboboxProps {
    value?: Nullish<string>;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: React.ComponentProps<typeof FormInput>['error'];
}

const workModeItems = [tr('Office'), tr('Mixed'), tr('Remote')];

export const WorkModeCombobox = ({ value, onChange, placeholder }: WorkModeComboboxProps) => {
    const [search, setSearch] = useState(value ?? '');
    const suggestionsVisibility = useBoolean(false);

    const filtered = useMemo(() => workModeItems.filter((item) => item.includes(search)), [search]);

    return (
        <ComboBox
            value={search}
            onChange={(mode: string) => {
                setSearch(mode);
                suggestionsVisibility.setFalse();
                onChange(mode);
            }}
            visible={suggestionsVisibility.value}
            items={filtered}
            renderInput={(props) => (
                <Input
                    placeholder={placeholder ?? tr('Choose work mode')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        onChange('');
                        setSearch(e.target.value);
                    }}
                    {...props}
                />
            )}
            onClickOutside={(cb) => cb()}
            onClose={suggestionsVisibility.setFalse}
            renderItem={(props) => (
                <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                    <Text size="s" ellipsis>
                        {props.item}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
