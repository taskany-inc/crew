import {
    AppliedFilter,
    Badge,
    Counter,
    Input,
    Select,
    SelectPanel,
    SelectTrigger,
    TagCleanButton,
    Text,
} from '@taskany/bricks/harmony';
import { useState } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';

interface AppliedGroupFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedGroups: string[] | undefined;
    onChange: (group: { id: string; name: string }[]) => void;
    onClose: () => void;
}

export const AppliedGroupFilter = ({
    label,
    onCleanFilter,
    selectedGroups,
    onChange,
    onClose,
}: AppliedGroupFilterProps) => {
    const [groupQuery, setGroupQuery] = useState('');

    const { data: groups = [] } = trpc.group.suggestions.useQuery(
        {
            query: groupQuery,
            take: 5,
            include: selectedGroups,
        },
        {
            keepPreviousData: true,
        },
    );

    const groupValue = groups.filter((group) => selectedGroups?.includes(group.id));

    return (
        <AppliedFilter label={label} action={<TagCleanButton size="s" onClick={onCleanFilter} />}>
            <Select
                arrow
                value={groupValue}
                items={groups.map((group) => ({
                    ...group,
                    name: group.name,
                }))}
                onClose={onClose}
                onChange={onChange}
                selectable
                mode="multiple"
                renderItem={({ item }) => (
                    <Text key={item.id} size="s" ellipsis>
                        {item.name}
                    </Text>
                )}
            >
                <SelectTrigger>
                    {nullable(
                        selectedGroups && selectedGroups?.length > 1,
                        () => (
                            <Counter count={groupValue.length} />
                        ),
                        nullable(groupValue[0], (group) => <Badge weight="regular" text={group.name} />),
                    )}
                </SelectTrigger>
                <SelectPanel placement="bottom">
                    <Input placeholder="" onChange={(e) => setGroupQuery(e.target.value)} />
                </SelectPanel>
            </Select>
        </AppliedFilter>
    );
};
