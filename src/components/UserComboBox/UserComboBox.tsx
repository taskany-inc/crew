import { ComboBox, Input, UserMenuItem, UserPic, nullable } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';
import { useState } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { User } from '../../modules/userTypes';
import { Nullish } from '../../utils/types';

import { tr } from './UserComboBox.i18n';

interface UserComboBoxProps {
    user: Nullish<User>;
    onChange: (user: Nullish<User>) => void;
}

export const UserComboBox = ({ user, onChange }: UserComboBoxProps) => {
    const [search, setSearch] = useState('');
    const [comboboxVisibility, setComboboxVisibility] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Nullish<User>>(user);
    const userListQuery = trpc.user.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });

    return (
        <ComboBox
            value={selectedUser ? undefined : search}
            onChange={(value: User) => {
                setSearch(value.name || value.email);
                setSelectedUser(value);
                setComboboxVisibility(false);
                onChange(value);
            }}
            visible={comboboxVisibility}
            items={userListQuery.data?.users}
            renderInput={({ value, ...restProps }) => (
                <Input
                    iconLeft={nullable(selectedUser, (s) => (
                        <UserPic size={16} name={s.name} src={s.image} email={s.email} />
                    ))}
                    placeholder={tr('Choose user')}
                    autoFocus
                    size="m"
                    autoComplete="off"
                    value={value ?? selectedUser?.name}
                    onChange={(e) => {
                        setSelectedUser(null);
                        onChange(null);
                        setSearch(e.target.value);
                        setComboboxVisibility(true);
                    }}
                    {...restProps}
                />
            )}
            renderItem={(props) => (
                <UserMenuItem
                    key={props.item.id}
                    focused={props.cursor === props.index}
                    name={props.item.name}
                    email={props.item.email}
                    image={props.item.image}
                    onClick={props.onClick}
                    color={gray10}
                >
                    {props.item.name}
                </UserMenuItem>
            )}
        />
    );
};
