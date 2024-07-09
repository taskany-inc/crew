import { useState } from 'react';
import { UserRole } from 'prisma/prisma-client';
import { gray9 } from '@taskany/colors';
import { IconAddressBookOutline } from '@taskany/icons';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './UserRoleComboBox.i18n';

interface UserRoleComboBoxProps {
    role?: Nullish<UserRole>;
    roleName?: string;
    onChange: (role: Nullish<UserRole>) => void;
}

export const UserRoleComboBox = ({ role, onChange, roleName }: UserRoleComboBoxProps) => {
    const [search, setSearch] = useState(role?.name || roleName || '');
    const suggestionsVisibility = useBoolean(false);
    const [selectedRole, setSelectedRole] = useState<Nullish<UserRole>>(role);
    const userRolesQuery = trpc.userRole.getListWithScope.useQuery({ query: search });

    return (
        <ComboBox
            value={search}
            onChange={(value: UserRole) => {
                setSearch(value.name);
                setSelectedRole(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={userRolesQuery.data}
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
                <MenuItem key={props.item.code} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                    <Text size="s" ellipsis>
                        {props.item.name}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
