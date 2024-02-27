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

export const objByKeyMulti = <T extends Record<string, unknown>, K extends keyof T>(
    array: T[],
    key: K,
): Record<string, T[]> => {
    const result = {} as Record<string, T[]>;
    array.forEach((item) => {
        const k = String(item[key]);
        if (result[k]) {
            result[k].push(item);
        } else {
            result[k] = [item];
        }
    });
    return result;
};
