import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconUsersOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './GroupComboBox.i18n';

interface GroupComboBoxProps {
    group?: Nullish<Group>;
    onChange: (group: Nullish<Group>) => void;
}

export const GroupComboBox = ({ group, onChange }: GroupComboBoxProps) => {
    const [search, setSearch] = useState('');
    const suggestionsVisibility = useBoolean(false);
    const [selectedGroup, setSelectedGroup] = useState(group);
    const groupsQuery = trpc.group.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });

    return (
        <ComboBox
            value={selectedGroup ? undefined : search}
            onChange={(value: Group) => {
                setSearch(value.name);
                setSelectedGroup(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={groupsQuery.data}
            renderInput={({ value, ...restProps }) => (
                <Input
                    iconLeft={nullable(selectedGroup, () => (
                        <IconUsersOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose team')}
                    size="m"
                    autoComplete="off"
                    value={value ?? selectedGroup?.name}
                    onFocus={suggestionsVisibility.setTrue}
                    onBlur={() => setTimeout(suggestionsVisibility.setFalse, 100)}
                    onChange={(e) => {
                        setSelectedGroup(null);
                        onChange(null);
                        setSearch(e.target.value);
                    }}
                    {...restProps}
                />
            )}
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
