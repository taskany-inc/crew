/* eslint-disable no-nested-ternary */
import { useMemo } from 'react';
import { UserPic, Tab, FilterBase, FilterCheckbox, FilterTabLabel, FilterAutoCompleteInput } from '@taskany/bricks';

import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './UserFilter.i18n';

interface User {
    id: string;
    name: string | null;
    email: string;
}

interface UserFilterProps {
    tabName: string;
    text: string;
    users: User[];
    value?: string[];
    onChange: (items: string[]) => void;
    onSearchChange: (searchQuery: string) => void;
    title?: {
        inputPlaceholder: string;
        search: string;
    };
}

const getId = (item: User) => item.id;

export const UserFilter: React.FC<UserFilterProps> = ({
    text,
    tabName,
    users,
    value = [],
    onChange,
    onSearchChange,
}) => {
    const sessionUser = useSessionUser();

    const values = useMemo(() => {
        return users.filter((u) => value.includes(getId(u)));
    }, [value, users]);

    return (
        <Tab name={tabName} label={<FilterTabLabel text={text} selected={values.map((u) => u.name || u.email)} />}>
            <FilterBase
                title={tr('Suggestions')}
                key={tabName}
                mode="multiple"
                viewMode="split"
                items={users}
                keyGetter={getId}
                value={values}
                onChange={onChange}
                renderItem={({ item, checked, onItemClick }) => {
                    let label = item.name || item.email;

                    if (item.id === sessionUser.id) {
                        label += ` (${tr('You')})`;
                    }

                    return (
                        <FilterCheckbox
                            name="user"
                            value={item.id}
                            checked={checked}
                            onClick={onItemClick}
                            iconLeft={<UserPic name={item.name} email={item.email} size={14} />}
                            label={label}
                        />
                    );
                }}
            >
                <FilterAutoCompleteInput placeholder={tr('Search...')} onChange={onSearchChange} />
            </FilterBase>
        </Tab>
    );
};
