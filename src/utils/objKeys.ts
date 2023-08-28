export const objKeys = <T extends Record<string, unknown>>(obj: T): (keyof T)[] => Object.keys(obj);
