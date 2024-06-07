import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconUsersOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './GroupComboBox.i18n';

interface GroupComboBoxProps {
    defaultGroup?: Nullish<Group>;
    onChange: (group: Nullish<Group>) => void;
}

export const GroupComboBox = ({ defaultGroup, onChange }: GroupComboBoxProps) => {
    const [search, setSearch] = useState(defaultGroup?.name || '');
    const suggestionsVisibility = useBoolean(false);
    const sessionUser = useSessionUser();
    const [selectedGroup, setSelectedGroup] = useState(defaultGroup);

    const showUserGroups = !sessionUser?.role?.editFullGroupTree;

    const { data: groupsList = [] } = trpc.group.getList.useQuery(
        { search },
        { keepPreviousData: true, enabled: !showUserGroups },
    );

    const { data: userGroupList = [] } = trpc.group.getUserList.useQuery(
        {
            search,
        },
        {
            keepPreviousData: true,
            enabled: showUserGroups,
        },
    );

    return (
        <ComboBox
            value={search}
            onChange={(value: Group) => {
                setSearch(value.name);
                setSelectedGroup(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={showUserGroups ? userGroupList : groupsList}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedGroup, () => (
                        <IconUsersOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose team')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        setSelectedGroup(null);
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
