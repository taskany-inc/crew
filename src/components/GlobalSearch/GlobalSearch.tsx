import React, { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import {
    ListView,
    ListViewItem,
    Table,
    Text,
    GlobalSearch as TaskanyGlobalSearch,
    MenuItem,
} from '@taskany/bricks/harmony';
import { IconUserOutline, IconUsersOutline } from '@taskany/icons';
import { Group, User } from 'prisma/prisma-client';

import { trpc } from '../../trpc/trpcClient';
import { useRouter } from '../../hooks/useRouter';

import { tr } from './GlobalSearch.i18n';
import s from './GlobalSearch.module.css';

type Entity = 'user' | 'team';

type ListViewItemValue = [Entity, string];

interface SearchResultsProps {
    entity: Entity;
    items?: Group[] | User[];
    onClick: (arg: ListViewItemValue) => void;
}

const SearchResults = ({ items, entity, onClick }: SearchResultsProps) => (
    <Table>
        {items?.map((item) => (
            <ListViewItem
                key={item.id}
                value={[entity, item.id]}
                renderItem={({ active, hovered, ...props }) => (
                    <MenuItem
                        className={s.GlobalSearchMenuItem}
                        onClick={() => onClick([entity, item.id])}
                        hovered={active || hovered}
                        {...props}
                    >
                        {item.name}
                    </MenuItem>
                )}
            />
        ))}
    </Table>
);

export const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const router = useRouter();

    const suggestions = trpc.search.global.useQuery(debouncedQuery, { enabled: !!debouncedQuery.length });
    const resultsExists = Boolean(suggestions.data?.users?.length || suggestions.data?.groups.length);

    const onKeyboardNavigate = useCallback(
        ([entity, id]: ListViewItemValue) => {
            router[entity](id);
        },
        [router],
    );

    const nothingFound = Boolean(!resultsExists && query.length);

    return (
        <TaskanyGlobalSearch
            value={query}
            onChange={setQuery}
            searchResultExists={resultsExists || nothingFound}
            placeholder={tr('Search')}
            placement="bottom-end"
            offset={[8, -20]}
            outline
        >
            <ListView onKeyboardClick={onKeyboardNavigate}>
                {nullable(suggestions.data?.users?.length, () => (
                    <>
                        <Text size="m" weight="bolder" className={s.GlobalSearchGroupHeader}>
                            {tr('Users')} <IconUserOutline size="s" />
                        </Text>
                        <SearchResults entity="user" onClick={onKeyboardNavigate} items={suggestions.data?.users} />
                    </>
                ))}
                {nullable(suggestions.data?.groups?.length, () => (
                    <>
                        <Text size="m" weight="bolder" className={s.GlobalSearchGroupHeader}>
                            {tr('Teams')} <IconUsersOutline size="s" />
                        </Text>
                        <SearchResults entity="team" onClick={onKeyboardNavigate} items={suggestions.data?.groups} />
                    </>
                ))}
            </ListView>
            {nullable(nothingFound, () => (
                <Text size="m" weight="bolder" className={cn(s.GlobalSearchGroupHeader, s.GlobalSearchNothingFound)}>
                    {tr('Nothing found')}
                </Text>
            ))}
        </TaskanyGlobalSearch>
    );
};
