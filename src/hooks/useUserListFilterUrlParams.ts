import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUrlParams } from '@taskany/bricks';
import { debounce } from 'throttle-debounce';

import { UserFilterQuery } from '../modules/userTypes';

export const useUserListFilterUrlParams = () => {
    const router = useRouter();
    const pushUrl = useCallback((url: string) => router.push(url), [router]);

    const { values, setter, clearParams } = useUrlParams(
        {
            search: 'string',
            activeQuery: 'string',
            groupsQuery: 'stringArray',
            rolesQuery: 'stringArray',
            supervisorsQuery: 'stringArray',
        },
        router.query,
        pushUrl,
    );

    const setFiltersQuery = useCallback((filters: UserFilterQuery) => {
        Object.entries(filters).forEach(([key, value]) => {
            setter(key as keyof UserFilterQuery, value);
        });
    }, []);

    const setSearch = useCallback(
        debounce(300, (v: string) => {
            setter('search', v);
        }),
        [],
    );

    return { values, setFiltersQuery, clearParams, setSearch };
};
