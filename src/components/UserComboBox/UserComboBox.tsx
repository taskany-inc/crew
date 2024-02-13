import { ComboBox, Input, UserMenuItem, nullable } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';
import { useState } from 'react';
import { User } from 'prisma/prisma-client';

import { trpc } from '../../trpc/trpcClient';
import { Nullish } from '../../utils/types';
import { useBoolean } from '../../hooks/useBoolean';
import { UserPic } from '../UserPic';

import { tr } from './UserComboBox.i18n';

interface UserComboBoxProps {
    user?: Nullish<User>;
    onChange: (user: Nullish<User>) => void;
}

export const UserComboBox = ({ user, onChange }: UserComboBoxProps) => {
    const [search, setSearch] = useState(user?.name || '');
    const suggestionsVisibility = useBoolean(false);
    const [selectedUser, setSelectedUser] = useState<Nullish<User>>(user);
    const userListQuery = trpc.user.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });

    return (
        <ComboBox
            value={search}
            onChange={(value: User) => {
                setSearch(value.name || value.email);
                setSelectedUser(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={userListQuery.data?.users}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedUser, (s) => (
                        <UserPic size={16} user={s} />
                    ))}
                    placeholder={tr('Choose user')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        setSelectedUser(null);
                        onChange(null);
                        setSearch(e.target.value);
                    }}
                    {...props}
                />
            )}
            onClickOutside={(cb) => cb()}
            onClose={suggestionsVisibility.setFalse}
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
