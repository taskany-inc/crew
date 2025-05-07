import {
    AppliedFilter,
    Input,
    Select,
    SelectPanel,
    SelectTrigger,
    TagCleanButton,
    User,
    UserGroup,
} from '@taskany/bricks/harmony';
import React, { FC, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { suggestionsTake } from '../../utils/suggestions';

import { tr } from './AppliedUserFilter.i18n';

interface AppliedUserFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedUsers: string[] | undefined;
    onChange: (supervisors: { id: string; name: string; email: string }[]) => void;
    onClose: () => void;
}

export const AppliedUserFilter: FC<AppliedUserFilterProps> = ({
    label,
    onCleanFilter,
    selectedUsers,
    onChange,
    onClose,
}) => {
    const [supervisorQuery, setSupervisorQuery] = useState('');

    const { data: supervisors = [] } = trpc.user.suggestions.useQuery(
        {
            query: supervisorQuery,
            take: suggestionsTake,
            include: selectedUsers,
        },
        {
            keepPreviousData: true,
        },
    );

    const supervisorValue = supervisors
        .filter((supervisor) => selectedUsers?.includes(supervisor.id))
        .map((supervisor) => ({
            ...supervisor,
            name: supervisor.name || supervisor.email,
        }));

    return (
        <AppliedFilter label={label} action={<TagCleanButton size="s" onClick={onCleanFilter} />}>
            <Select
                arrow
                value={supervisorValue}
                items={supervisors.map((supervisor) => ({
                    ...supervisor,
                    name: supervisor.name || supervisor.email,
                    email: supervisor.email,
                }))}
                onClose={onClose}
                onChange={onChange}
                selectable
                mode="multiple"
                renderItem={({ item }) => <User name={item.name} email={item.email} />}
            >
                <SelectTrigger>
                    {nullable(
                        selectedUsers && selectedUsers?.length > 1,
                        () => (
                            <UserGroup users={supervisorValue} />
                        ),
                        nullable(supervisorValue[0], (user) => <User name={user.name} email={user.email} />),
                    )}
                </SelectTrigger>
                <SelectPanel placement="bottom" title={tr('Suggestions')}>
                    <Input placeholder={tr('Search')} onChange={(e) => setSupervisorQuery(e.target.value)} />
                </SelectPanel>
            </Select>
        </AppliedFilter>
    );
};
