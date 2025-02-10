import { nullable } from '@taskany/bricks';
import { ChangeEvent, useState } from 'react';
import { User } from '@prisma/client';
import {
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    User as HarmonyUser,
    Input,
    ListView,
    ListViewItem,
    MenuItem,
} from '@taskany/bricks/harmony';
import { IconSearchOutline, IconXOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { Nullish } from '../../utils/types';
import { useBoolean } from '../../hooks/useBoolean';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';

import s from './UserComboBox.module.css';

interface UserComboBoxProps {
    value?: Nullish<Omit<User, 'roleDeprecated'>>;
    placeholder?: string;
    blank?: boolean;

    onChange: (value: Nullish<User>) => void;
}

export const UserComboBox = ({ value, onChange, placeholder, blank }: UserComboBoxProps) => {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(value);
    const suggestionsVisibility = useBoolean(false);
    const userListQuery = trpc.user.getList.useQuery(
        { search, take: 10 },
        { keepPreviousData: true, enabled: Boolean(suggestionsVisibility.value && search) },
    );

    const onUserChange = (user: User) => {
        onChange && onChange(user);
        !blank && setSelectedUser(user);
        suggestionsVisibility.setFalse();
    };

    return (
        <div className={s.CrewUserSelector}>
            <Dropdown isOpen={suggestionsVisibility.value} onClose={suggestionsVisibility.setFalse}>
                <DropdownTrigger
                    renderTrigger={(props) => (
                        <div ref={props.ref}>
                            {nullable(
                                selectedUser,
                                (user) => (
                                    <HarmonyUser
                                        name={user.name}
                                        email={user.email}
                                        iconRight={<IconXOutline size="s" onClick={() => setSelectedUser(null)} />}
                                    />
                                ),
                                <AddInlineTrigger
                                    text={placeholder || ''}
                                    onClick={suggestionsVisibility.setTrue}
                                    ref={props.ref}
                                />,
                            )}
                        </div>
                    )}
                />
                <DropdownPanel placement="bottom-start">
                    <Input
                        placeholder={placeholder}
                        outline
                        autoFocus
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setSearch(e.currentTarget.value);
                            suggestionsVisibility.setTrue();
                        }}
                        iconLeft={<IconSearchOutline size="s" />}
                    />
                    <ListView>
                        {userListQuery.data?.users?.map((user) => (
                            <ListViewItem
                                key={user.id}
                                renderItem={({ active, hovered, ...props }) => (
                                    <MenuItem hovered={active || hovered}>
                                        <HarmonyUser
                                            className={s.ListItem}
                                            onClick={() => onUserChange(user)}
                                            name={user.name}
                                            email={user.email}
                                            {...props}
                                        />
                                    </MenuItem>
                                )}
                            />
                        ))}
                    </ListView>
                </DropdownPanel>
            </Dropdown>
        </div>
    );
};
