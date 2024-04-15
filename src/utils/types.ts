export type Nullish<T> = T | undefined | null;

export type ExtractKeysOfType<T, K> = { [I in keyof T]: T[I] extends K ? I : never }[keyof T];
