import React, { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import {
    ListView,
    ListViewItem,
    Table,
    nullable,
    Text,
    GlobalSearch as TaskanyGlobalSearch,
    MenuItem,
} from '@taskany/bricks';
import { IconUserOutline, IconUsersOutline } from '@taskany/icons';
import styled from 'styled-components';
import { gapS, gapXs, gray4 } from '@taskany/colors';
import { Group, User } from 'prisma/prisma-client';

import { trpc } from '../../trpc/trpcClient';
import { useRouter } from '../../hooks/useRouter';

import { tr } from './GlobalSearch.i18n';

type Entity = 'user' | 'team';

type ListViewItemValue = [Entity, string];

const StyledGroupHeader = styled(Text)`
    display: flex;
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;

    padding-top: ${gapS};
    padding-bottom: ${gapXs};
    margin: 0 ${gapS};

    max-width: 392px;

    border-bottom: 1px solid ${gray4};
`;

const StyledMenuItem = styled(MenuItem)`
    border: none;
`;

const tableWidth = 400;

interface SearchResultsProps {
    entity: Entity;
    items?: Group[] | User[];
    onClick: (arg: ListViewItemValue) => void;
}

const SearchResults = ({ items, entity, onClick }: SearchResultsProps) => (
    <Table width={tableWidth}>
        {items?.map((item) => (
            <ListViewItem
                key={item.id}
                value={[entity, item.id]}
                renderItem={({ active, ...props }) => (
                    <StyledMenuItem onClick={() => onClick([entity, item.id])} focused={active} {...props}>
                        {item.name}
                    </StyledMenuItem>
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

    return (
        <TaskanyGlobalSearch
            query={query}
            setQuery={setQuery}
            searchResultExists={resultsExists}
            placeholder={tr('Search or jump to...')}
        >
            <ListView onKeyboardClick={onKeyboardNavigate}>
                {nullable(suggestions.data?.users?.length, () => (
                    <>
                        <StyledGroupHeader size="m" weight="bolder">
                            {tr('Users')} <IconUserOutline size="s" />
                        </StyledGroupHeader>
                        <SearchResults entity="user" onClick={onKeyboardNavigate} items={suggestions.data?.users} />
                    </>
                ))}
                {nullable(suggestions.data?.groups?.length, () => (
                    <>
                        <StyledGroupHeader size="m" weight="bolder">
                            {tr('Teams')} <IconUsersOutline size="s" />
                        </StyledGroupHeader>
                        <SearchResults entity="team" onClick={onKeyboardNavigate} items={suggestions.data?.groups} />
                    </>
                ))}
            </ListView>
        </TaskanyGlobalSearch>
    );
};
