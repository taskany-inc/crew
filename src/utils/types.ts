export type Nullish<T> = T | undefined | null;

export type ExtractKeysOfType<T, K> = { [I in keyof T]: T[I] extends K ? I : never }[keyof T];

export type NonNullableFields<T, K extends keyof T = never> = {
    [P in keyof T]-?: P extends K ? T[P] : Exclude<T[P], null | undefined>;
};

/**
 * Pulls the prop type from `getServerSideProps`, similar to `InferGetServerSidePropsType` from next.
 * Needed because the standard utility breaks if the function contains `return { redirect: {} }`.
 */
export type InferServerSideProps<T extends (...args: any) => any> = Exclude<
    Awaited<ReturnType<T>>,
    { redirect: any } | { notFound: boolean }
>['props'];
