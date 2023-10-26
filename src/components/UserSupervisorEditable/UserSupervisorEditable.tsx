import { ComboBox, Input, MenuItem } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { User } from '../../modules/userTypes';

import { tr } from './UserSupervisorEditable.i18n';

const StyledComboBox = styled(ComboBox)`
    width: fit-content;
`;

interface UserSupervisorEditableProps {
    user?: User | null;
    onChange: (user: User) => void;
}

export const UserSupervisorEditable = ({ onChange }: UserSupervisorEditableProps) => {
    const [search, setSearch] = useState('');
    const [selectedSupervisor, setSelectedSupervisor] = useState<User | undefined>();
    const userListQuery = trpc.user.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });

    return (
        <StyledComboBox
            value={selectedSupervisor ? undefined : search}
            onChange={(value: User) => {
                setSearch(value.name || value.email);
                setSelectedSupervisor(value);
                onChange(value);
            }}
            visible={!selectedSupervisor}
            items={userListQuery.data}
            maxWidth={100}
            renderInput={({ value, ...restProps }) => (
                <Input
                    placeholder={tr('Choose a supervisor')}
                    autoFocus
                    size="m"
                    autoComplete="off"
                    value={value ?? search}
                    onChange={(e) => {
                        setSelectedSupervisor(undefined);
                        setSearch(e.target.value);
                    }}
                    {...restProps}
                />
            )}
            renderItem={(props) => (
                <MenuItem
                    key={props.item.id}
                    ghost
                    focused={props.cursor === props.index}
                    onClick={props.onClick}
                    color={gray10}
                >
                    {props.item.name}
                </MenuItem>
            )}
        />
    );
};
