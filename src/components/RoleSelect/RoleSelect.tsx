import { useState } from 'react';
import { Role } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { Input, Text, Select, SelectPanel, SelectTrigger } from '@taskany/bricks/harmony';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './RoleSelect.i18n';

interface RoleSelectProps {
    roleName?: string;
    onChange: (role: Nullish<Role>) => void;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];

    className?: string;
}

export const RoleSelect = ({ onChange, error, className, roleName }: RoleSelectProps) => {
    const [search, setSearch] = useState('');
    const rolesQuery = trpc.role.suggestions.useQuery(
        {
            query: search,
            includeName: roleName ? [roleName] : undefined,
            take: 10,
        },
        { keepPreviousData: true },
    );

    const value = rolesQuery.data?.filter(({ name }) => name === roleName);

    return (
        <Select
            arrow
            value={value}
            items={rolesQuery.data}
            onChange={(roles) => onChange(roles[0])}
            selectable
            mode="single"
            renderItem={(props) => (
                <Text key={props.item.id} size="s" ellipsis>
                    {props.item.name}
                </Text>
            )}
        >
            <SelectTrigger size="m" error={error} placeholder={tr('Choose role')} view="outline" className={className}>
                {nullable(value && value[0], (r) => r.name)}
            </SelectTrigger>
            <SelectPanel placement="bottom-start" title={tr('Suggestions')}>
                <Input autoFocus placeholder={tr('Search')} onChange={(e) => setSearch(e.target.value)} />
            </SelectPanel>
        </Select>
    );
};
