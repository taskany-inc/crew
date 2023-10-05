import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { useUserMutations } from '../../modules/user.hooks';

import { tr } from './users.i18n';

type AddTeamToUserFormProps = {
    userId: string;
};

const StyledRowWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(calc(240px), 20%) max-content;
`;

export const AddTeamToUserForm = ({ userId }: AddTeamToUserFormProps) => {
    const [search, setSearch] = useState('');
    const groupListQuery = trpc.group.getList.useQuery({ search, take: 10 });
    const [selectedGroup, setSelectedGroup] = useState<Group>();
    const { addUserToGroup } = useUserMutations();

    const onReset = () => {
        setSearch('');
        setSelectedGroup(undefined);
    };

    const onSubmit = async () => {
        if (!selectedGroup) {
            return;
        }
        await addUserToGroup.mutateAsync({ userId, groupId: selectedGroup.id });
        onReset();
    };

    return (
        <InlineForm
            onSubmit={onSubmit}
            onReset={onReset}
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add team')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
        >
            <ComboBox
                value={selectedGroup ? undefined : search}
                visible={!selectedGroup}
                onChange={(value: Group) => {
                    setSearch(value.name);
                    setSelectedGroup(value);
                }}
                items={groupListQuery.data}
                maxWidth={550}
                renderInput={({ value, ...restProps }) => (
                    <StyledRowWrapper>
                        <Input
                            autoFocus
                            autoComplete="off"
                            value={value ?? search}
                            onChange={(e) => {
                                setSelectedGroup(undefined);
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
                            disabled={!selectedGroup}
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
