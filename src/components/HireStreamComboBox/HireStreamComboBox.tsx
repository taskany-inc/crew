import { useMemo, useState } from 'react';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconCodeOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';
import { HireStream } from '../../modules/hireIntegrationTypes';

import { tr } from './HireStreamComboBox.i18n';

interface HireStreamComboBoxProps {
    hireStream?: Nullish<HireStream>;
    onChange: (hireStream: Nullish<HireStream>) => void;
}

export const HireStreamComboBox = ({ hireStream, onChange }: HireStreamComboBoxProps) => {
    const [search, setSearch] = useState('');
    const suggestionsVisibility = useBoolean(false);
    const [selectedHireStream, setSelectedHireStream] = useState(hireStream);
    const hireStreamQuery = trpc.hireIntegration.getHireStreamList.useQuery();

    const items = useMemo(
        () => hireStreamQuery.data?.filter(({ name }) => name.toLowerCase().includes(search.toLowerCase())),
        [search, hireStreamQuery],
    );

    return (
        <ComboBox
            value={search}
            onChange={(value: HireStream) => {
                setSearch(value.name);
                setSelectedHireStream(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={items}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedHireStream, () => (
                        <IconCodeOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose hire stream')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        setSelectedHireStream(null);
                        onChange(null);
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
                        {props.item.name}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
