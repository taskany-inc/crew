export type GroupTreeQueryResult =
    | {
          id: string;
          children: GroupTreeQueryResult[];
          [key: string]: unknown;
      }
    | {
          id: string;
          children?: never;
          [key: string]: unknown;
      };

export const mergeBranches = <T extends GroupTreeQueryResult>(...branches: T[]): T[] => {
    const merge = (...chains: T[]): T[] => {
        return Object.entries(
            chains.reduce<Record<string, T>>((acc, { id, children = [], ...rest }) => {
                acc[id] = {
                    ...acc[id],
                    ...rest,
                    children: (acc[id]?.children || []).concat(children),
                };

                return acc;
            }, {}),
        ).map(([id, { children, ...rest }]) => ({
            id,
            ...rest,
            children: children != null ? merge(...(children as T[])) : undefined,
        })) as T[];
    };

    return merge(...branches);
};
