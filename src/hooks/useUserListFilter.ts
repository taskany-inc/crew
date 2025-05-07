import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUrlParams } from '@taskany/bricks';
import { debounce } from 'throttle-debounce';

import { UserFilterQuery } from '../modules/userTypes';

export const useUserListFilter = () => {
    const router = useRouter();
    const pushUrl = useCallback((url: string) => router.push(url), [router]);

    const { values, setter, clearParams } = useUrlParams(
        {
            search: 'string',
            activity: 'string',
            groups: 'stringArray',
            includeChildrenGroups: 'boolean',
            roles: 'stringArray',
            supervisors: 'stringArray',
            author: 'stringArray',
        },
        router.query,
        pushUrl,
    );

    const setFiltersQuery = useCallback(
        (filters: UserFilterQuery) => {
            Object.entries(filters).forEach(([key, value]) => {
                setter(key as keyof UserFilterQuery, value);
            });
        },
        [setter],
    );

    const setSearch = useCallback(
        debounce(300, (v: string) => {
            setter('search', v);
        }),
        [setter],
    );

    return { values: values as UserFilterQuery, setFiltersQuery, clearParams, setSearch };
};
