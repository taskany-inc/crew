export const sortByStringKey = <T extends Record<string, any>>(items: T[], keys: (string | number)[]): T[] => {
    return [...items].sort((a, b) => {
        const aValue = keys
            .reduce((obj, key) => obj?.[key], a)
            ?.toString()
            .toLowerCase();
        const bValue = keys
            .reduce((obj, key) => obj?.[key], b)
            ?.toString()
            .toLowerCase();
        return aValue?.localeCompare(bValue ?? '') ?? 0;
    });
};
