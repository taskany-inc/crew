// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapObject = <T extends Record<string, any>, K extends keyof T, P>(obj: T, cb: (value: T[K]) => P) => {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, cb(value)]));
};
