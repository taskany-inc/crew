import { useState } from 'react';
import { Role } from 'prisma/prisma-client';
import { gray9 } from '@taskany/colors';
import { IconAddressBookOutline } from '@taskany/icons';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './RoleComboBox.i18n';

interface RoleComboBoxProps {
    role?: Nullish<Role>;
    onChange: (role: Nullish<Role>) => void;
}

export const RoleComboBox = ({ role, onChange }: RoleComboBoxProps) => {
    const [search, setSearch] = useState('');
    const suggestionsVisibility = useBoolean(false);
    const [selectedRole, setSelectedRole] = useState<Nullish<Role>>(role);
    const rolesQuery = trpc.role.getList.useQuery({ search, take: 10 });

    return (
        <ComboBox
            value={search}
            onChange={(value: Role) => {
                setSearch(value.name);
                setSelectedRole(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={rolesQuery.data}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedRole, () => (
                        <IconAddressBookOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose name')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        setSelectedRole(null);
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
