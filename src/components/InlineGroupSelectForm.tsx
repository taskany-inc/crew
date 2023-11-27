import { ReactNode, useState } from 'react';
import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';
import { textColor } from '@taskany/colors';

import { trpc } from '../trpc/trpcClient';

import { InlineTrigger } from './InlineTrigger';

const StyledRowWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(calc(240px), 20%) max-content;
`;

type InlineGroupSelectFormProps = {
    triggerText?: string;
    icon?: ReactNode;
    actionText: string;
    onSubmit: (group: Group) => Promise<void>;
    filter?: string[];
};

export const InlineGroupSelectForm = (props: InlineGroupSelectFormProps) => {
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<Group>();
    const groupListQuery = trpc.group.getList.useQuery({ search, take: 10, filter: props.filter });

    const onReset = () => {
        setSearch('');
        setSelectedGroup(undefined);
    };

    const onSubmit = async () => {
        if (!selectedGroup) return;
        await props.onSubmit(selectedGroup);
        onReset();
    };

    return (
        <InlineForm
            onSubmit={onSubmit}
            onReset={onReset}
            renderTrigger={(triggerProps) => (
                <InlineTrigger
                    text={props.triggerText}
                    icon={props.icon ?? <IconPlusCircleSolid size="s" />}
                    {...triggerProps}
                />
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
                            text={props.actionText}
                            type="submit"
                            disabled={!selectedGroup}
                            outline
                        />
                    </StyledRowWrapper>
                )}
                renderItem={(itemProps) => (
                    <MenuItem
                        color={textColor}
                        key={itemProps.item.id}
                        focused={itemProps.cursor === itemProps.index}
                        onClick={itemProps.onClick}
                        ghost
                    >
                        {itemProps.item.name}
                    </MenuItem>
                )}
            />
        </InlineForm>
    );
};
