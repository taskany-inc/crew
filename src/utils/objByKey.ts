export const objByKey = <T extends Record<string, unknown>, K extends keyof T>(
    array: T[],
    key: K,
): Record<string, T> => {
    const result = {} as Record<string, T>;
    array.forEach((item) => {
        result[String(item[key])] = item;
    });
    return result;
};
