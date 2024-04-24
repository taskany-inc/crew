type PartialWithoutNulls<T> = Partial<{ [K in keyof T]: Exclude<T[K], null> }>;

export const dropUnchangedValuesFromEvent = <T extends Record<string, unknown>>(
    before: T,
    after: T,
): { before: PartialWithoutNulls<T>; after: PartialWithoutNulls<T> } => {
    const resultBefore: Record<string, unknown> = {};
    const resultAfter: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    keys.forEach((key) => {
        if (before[key] !== after[key]) {
            resultBefore[key] = before[key] === null ? undefined : before[key];
            resultAfter[key] = after[key] === null ? undefined : after[key];
        }
    });
    return { before: resultBefore as PartialWithoutNulls<T>, after: resultAfter as PartialWithoutNulls<T> };
};
