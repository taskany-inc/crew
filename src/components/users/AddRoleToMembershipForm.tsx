import { useState } from 'react';
import { Role } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { useRoleMutations } from '../../modules/role.hooks';

import { tr } from './users.i18n';

type AddRoleToMembershipFormProps = {
    membershipId: string;
};

const StyledRowWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(calc(240px), 20%) max-content;
`;

const StyledInlineTrigger = styled(InlineTrigger)`
    height: 28px;
`;

export const AddRoleToMembershipForm = ({ membershipId }: AddRoleToMembershipFormProps) => {
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role>();
    const roleListQuery = trpc.role.getList.useQuery({ search, take: 5 });
    const { addToMembership } = useRoleMutations();

    const onReset = () => {
        setSearch('');
        setSelectedRole(undefined);
    };

    const onSubmit = async () => {
        if (!selectedRole) {
            return;
        }
        await addToMembership.mutateAsync({ membershipId, roleId: selectedRole.id });
        onReset();
    };

    return (
        <InlineForm
            onSubmit={onSubmit}
            onReset={onReset}
            renderTrigger={(props) => (
                <StyledInlineTrigger text={tr('Add role')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
        >
            <ComboBox
                value={selectedRole ? undefined : search}
                visible={!selectedRole}
                onChange={(value: Role) => {
                    setSearch(value.name);
                    setSelectedRole(value);
                }}
                items={roleListQuery.data}
                maxWidth={550}
                renderInput={({ value, ...restProps }) => (
                    <StyledRowWrapper>
                        <Input
                            autoFocus
                            autoComplete="off"
                            value={value ?? search}
                            onChange={(e) => {
                                setSelectedRole(undefined);
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
                            disabled={!selectedRole}
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
