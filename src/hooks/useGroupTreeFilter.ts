import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUrlParams } from '@taskany/bricks';

export interface GroupTreeFilterValues {
    supervisor?: string[];
}

export const useGroupTreeFilter = () => {
    const router = useRouter();
    const pushUrl = useCallback((url: string) => router.push(url), [router]);

    const { values, setter, clearParams } = useUrlParams(
        {
            supervisor: 'stringArray',
        },
        router.query,
        pushUrl,
    );

    const isEmpty = useMemo(() => Object.values(values).filter(Boolean).length === 0, [values]);

    return { values, setter, clearParams, isEmpty };
};

export const groupTreeFilterValuesToRequestData = (values: ReturnType<typeof useGroupTreeFilter>['values']) => ({
    supervisor: values.supervisor && values.supervisor.length > 0 ? values.supervisor : undefined,
});

export type GroupTreeFilterRequestData = ReturnType<typeof groupTreeFilterValuesToRequestData>;

export const groupMatchesFilters = <T extends { group: { supervisorId?: string | null } }>(
    group: T,
    filters: GroupTreeFilterRequestData,
): boolean => {
    if (!filters || Object.keys(filters).length === 0) {
        return true;
    }

    let matches = true;

    if (filters.supervisor && filters.supervisor.length > 0) {
        const hasSupervisor = !!group.group?.supervisorId && filters.supervisor.includes(group.group.supervisorId);
        matches = matches && hasSupervisor;
    }

    // we can add other filters here

    return matches;
};

interface GroupTree {
    id: string;
    group: { supervisorId?: string | null };
    children?: GroupTree[];
}

export const filterGroupTree = <T extends GroupTree>(
    group: T | null | undefined,
    filters: GroupTreeFilterRequestData,
): T | null => {
    if (!group || !filters || Object.keys(filters).length === 0) {
        return group ?? null;
    }

    const groupMatches = groupMatchesFilters(group, filters);

    if (groupMatches) {
        return { ...group };
    }

    const filteredChildren = (group.children ?? [])
        .map((child) => filterGroupTree(child, filters))
        .filter((child): child is T => child !== null);

    return filteredChildren.length > 0
        ? {
              ...group,
              children: filteredChildren,
          }
        : null;
};
