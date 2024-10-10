import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { Select, SelectPanel, SelectTrigger, Input, Text } from '@taskany/bricks/harmony';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './GroupComboBox.i18n';

interface GroupComboBoxProps {
    defaultGroupId?: string;
    onChange: (group: Nullish<Group>) => void;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];

    className?: string;
}

export const GroupComboBox = ({ defaultGroupId, onChange, error, className }: GroupComboBoxProps) => {
    const [search, setSearch] = useState('');
    const sessionUser = useSessionUser();

    const showUserGroups = !sessionUser?.role?.editFullGroupTree;

    const { data: groupsList = [] } = trpc.group.suggestions.useQuery(
        { query: search, include: defaultGroupId ? [defaultGroupId] : undefined },
        { keepPreviousData: true, enabled: !showUserGroups },
    );
    const value = groupsList.filter(({ id }) => id === defaultGroupId);

    const { data: userGroupList = [] } = trpc.group.getUserList.useQuery(
        {
            search,
        },
        {
            keepPreviousData: true,
            enabled: showUserGroups,
        },
    );

    return (
        <Select
            arrow
            value={value}
            items={showUserGroups ? userGroupList : groupsList}
            onChange={(groups) => onChange(groups[0])}
            selectable
            mode="single"
            renderItem={(props) => (
                <Text key={props.item.id} size="s" ellipsis>
                    {props.item.name}
                </Text>
            )}
        >
            <SelectTrigger error={error} placeholder={tr('Choose team')} view="outline" className={className}>
                {nullable(value && value[0], (g) => g.name)}
            </SelectTrigger>
            <SelectPanel placement="bottom-start" title={tr('Suggestions')}>
                <Input autoFocus placeholder={tr('Search')} onChange={(e) => setSearch(e.target.value)} />
            </SelectPanel>
        </Select>
    );
};
