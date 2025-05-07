import { useRouter } from "next/router";
import { tr } from "../components/ProfilesManagementLayout/ProfilesManagementLayout.i18n";
import { useCallback, useMemo } from "react";
import { useUrlParams } from "@taskany/bricks";

const getFilterValues = (path: string) => {
    switch (path) {
        case 'users/access':
            return [
                { id: 'organization', title: tr('Organization') },
                { id: 'manager', title: tr('Manager') },
                { id: 'author', title: tr('Author') },
                { id: 'date', title: tr('Date') }
            ];
        case 'users/newcomers':
            return [
                { id: 'status', title: tr('Status') },
                { id: 'team', title: tr('Team') },
                { id: 'manager', title: tr('Manager') },
                { id: 'author', title: tr('Author') },
                { id: 'date', title: tr('Date') }
            ];
        default:
            return [
                { id: 'organization', title: tr('Organization') },
                { id: 'group', title: tr('Group') },
                { id: 'team', title: tr('Team') },
                { id: 'date', title: tr('Date') }
            ];
    }
};

export const useRequestFilters = () => {
    const { pathname, push, query } = useRouter();
    const path = pathname.slice(pathname.indexOf('/', 1) + 1);
    const pushUrl = useCallback((url: string) => push(url), []);

    const filterValues = getFilterValues(path);

    const { values: currentValues, setter, clearParams } = useUrlParams(
        {
            status: 'stringArray',
            organization: 'stringArray',
            manager: 'stringArray',
            author: 'stringArray',
            team: 'stringArray',
            group: 'stringArray',
            dateFrom: 'string',
            dateTo: 'string',
        },
        query,
        pushUrl,
    );

    const isEmpty = useMemo(() => Object.values(currentValues).filter(Boolean).length === 0, [currentValues]);

    return { currentValues, setter, clearParams, filterValues, isEmpty };
};