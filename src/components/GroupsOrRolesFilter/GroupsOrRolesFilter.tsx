import { Tab, FilterBase, FilterCheckbox, FilterTabLabel, FilterAutoCompleteInput } from '@taskany/bricks';
import { useMemo } from 'react';

import { tr } from './GroupsOrRolesFilter.i18n';

type GroupOrRole = {
    id: string;
    name: string;
};

interface GroupsOrRolesFilterAutoCompleteProps {
    text: string;
    groupsOrRoles: GroupOrRole[];
    tabName: string;
    filterCheckboxName: string;
    value?: string[];
    onChange: (items: string[]) => void;
    onSearchChange: (query: string) => void;
}

const getKey = (groupOrRole: GroupOrRole) => groupOrRole.id;

export const GroupsOrRolesFilter: React.FC<GroupsOrRolesFilterAutoCompleteProps> = ({
    text,
    value = [],
    groupsOrRoles,
    tabName,
    filterCheckboxName,
    onChange,
    onSearchChange,
}) => {
    const values = useMemo(() => {
        return groupsOrRoles.filter((g) => value.includes(getKey(g)));
    }, [value, groupsOrRoles]);

    return (
        <Tab name={tabName} label={<FilterTabLabel text={text} selected={values.map(({ name }) => name)} />}>
            <FilterBase
                key={tabName}
                title={tr('Suggestions')}
                mode="multiple"
                viewMode="split"
                items={groupsOrRoles}
                value={values}
                keyGetter={getKey}
                onChange={onChange}
                renderItem={({ item, onItemClick, checked }) => (
                    <FilterCheckbox
                        name={filterCheckboxName}
                        value={item.id}
                        checked={checked}
                        onClick={onItemClick}
                        label={item.name}
                    />
                )}
            >
                <FilterAutoCompleteInput placeholder={tr('Search...')} onChange={onSearchChange} />
            </FilterBase>
        </Tab>
    );
};
