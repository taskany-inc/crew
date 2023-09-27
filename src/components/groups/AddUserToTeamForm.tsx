import { useState } from 'react';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { useUserMutations } from '../../modules/user.hooks';

import { tr } from './groups.i18n';

type AddUserToTeamFormProps = {
    groupId: string;
};

const StyledRowWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(calc(240px), 20%) max-content;
`;

export const AddUserToTeamForm = ({ groupId }: AddUserToTeamFormProps) => {
    const [search, setSearch] = useState('');
    const userListQuery = trpc.user.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });
    const [selectedUser, setSelectedUser] = useState<User>();
    const { addUserToGroup } = useUserMutations();

    const onReset = () => {
        setSearch('');
        setSelectedUser(undefined);
    };

    const onSubmit = async () => {
        if (!selectedUser) {
            return;
        }
        await addUserToGroup.mutateAsync({ userId: selectedUser.id, groupId });
        onReset();
    };

    return (
        <InlineForm
            onSubmit={onSubmit}
            onReset={onReset}
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add participant')} icon={<IconPlusCircleSolid noWrap size="s" />} {...props} />
            )}
        >
            <ComboBox
                value={selectedUser ? undefined : search}
                visible={!selectedUser}
                onChange={(value: User) => {
                    setSearch(value.name || value.email);
                    setSelectedUser(value);
                }}
                items={userListQuery.data}
                maxWidth={550}
                renderInput={({ value, ...restProps }) => (
                    <StyledRowWrapper>
                        <Input
                            autoFocus
                            autoComplete="off"
                            value={value ?? search}
                            onChange={(e) => {
                                setSelectedUser(undefined);
                                setSearch(e.target.value);
                            }}
                            brick="right"
                            {...restProps}
                        />
                        <Button
                            brick="left"
                            view="primary"
                            text={tr('Add')}
                            type="submit"
                            disabled={!selectedUser}
                            outline
                        />
                    </StyledRowWrapper>
                )}
                renderItem={(props) => (
                    <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                        {props.item.name}
                    </MenuItem>
                )}
            />
        </InlineForm>
    );
};
