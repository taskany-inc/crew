import { useState } from 'react';
import { OrganizationUnit } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { Select, SelectPanel, SelectTrigger, Input, Text } from '@taskany/bricks/harmony';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { OrganizationUnitSearchType } from '../../modules/organizationUnitSchemas';

import { tr } from './OrganizationUnitComboBox.i18n';

interface OrganizationUnitComboBoxProps {
    organizationUnitId?: string;
    searchType?: OrganizationUnitSearchType;
    onChange: (organizationUnit: Nullish<OrganizationUnit>) => void;
    inline?: boolean;
    placeholder?: string;
    label?: string;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];

    className?: string;
}

export const OrganizationUnitComboBox = ({
    organizationUnitId,
    searchType,
    onChange,
    className,
    error,
}: OrganizationUnitComboBoxProps) => {
    const [search, setSearch] = useState('');

    const organizationUnitQuery = trpc.organizationUnit.getList.useQuery(
        { search, take: 10, searchType, include: organizationUnitId ? [organizationUnitId] : undefined },
        { keepPreviousData: true },
    );

    const value = organizationUnitQuery.data?.filter(({ id }) => id === organizationUnitId);

    return (
        <Select
            arrow
            value={value}
            items={organizationUnitQuery.data}
            onChange={(orgs) => onChange(orgs[0])}
            selectable
            mode="single"
            renderItem={(props) => (
                <Text key={props.item.id} size="s" ellipsis>
                    {getOrgUnitTitle(props.item)}
                </Text>
            )}
        >
            <SelectTrigger
                size="m"
                error={error}
                placeholder={tr('Choose organization')}
                view="outline"
                className={className}
            >
                {nullable(value && value[0], (o) => getOrgUnitTitle(o))}
            </SelectTrigger>
            <SelectPanel placement="bottom-start" title={tr('Suggestions')}>
                <Input autoFocus placeholder={tr('Search')} onChange={(e) => setSearch(e.target.value)} />
            </SelectPanel>
        </Select>
    );
};
