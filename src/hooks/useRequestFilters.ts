import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { useUrlParams } from '@taskany/bricks';

import { tr } from '../components/ProfilesManagementLayout/ProfilesManagementLayout.i18n';

const getFilterValues = (path: string) => {
    switch (path) {
        case 'users/access':
            return [
                { id: 'organization', title: tr('Organization') },
                { id: 'manager', title: tr('Manager') },
                { id: 'author', title: tr('Author') },
                { id: 'dateFrom', title: tr('From') },
                { id: 'dateTo', title: tr('To') },
            ];
        case 'users/newcomers':
            return [
                { id: 'status', title: tr('Status') },
                { id: 'team', title: tr('Team') },
                { id: 'manager', title: tr('Manager') },
                { id: 'author', title: tr('Author') },
                { id: 'dateFrom', title: tr('From') },
                { id: 'dateTo', title: tr('To') },
            ];
        default:
            return [
                { id: 'organization', title: tr('Organization') },
                { id: 'team', title: tr('Team') },
                { id: 'dateFrom', title: tr('From') },
                { id: 'dateTo', title: tr('To') },
            ];
    }
};

export const useRequestFilters = () => {
    const { pathname, push, query } = useRouter();
    const path = pathname.slice(pathname.indexOf('/', 1) + 1);
    const pushUrl = useCallback((url: string) => push(url), []);

    const filterValues = getFilterValues(path);

    const {
        values: currentValues,
        setter,
        clearParams,
    } = useUrlParams(
        {
            status: 'stringArray',
            organization: 'stringArray',
            manager: 'stringArray',
            author: 'stringArray',
            team: 'stringArray',
            group: 'stringArray',
            dateFrom: 'stringArray',
            dateTo: 'stringArray',
        },
        query,
        pushUrl,
    );

    const isEmpty = useMemo(() => Object.values(currentValues).filter(Boolean).length === 0, [currentValues]);

    return { currentValues, setter, clearParams, filterValues, isEmpty };
};
