export type Nullish<T> = T | undefined | null;

export type ExtractKeysOfType<T, K> = { [I in keyof T]: T[I] extends K ? I : never }[keyof T];

export type NonNullableFields<T, K extends keyof T = never> = {
    [P in keyof T]-?: P extends K ? T[P] : Exclude<T[P], null | undefined>;
};
