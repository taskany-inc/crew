export enum Paths {
    HOME = '/',

    TEAMS = 'teams',

    USERS = 'users',
    USER = 'users/{userId}',

    SERVICES = 'services',
}

type ExtractPathVars<T extends string> = T extends `/{${infer Id}}/${infer Rest}`
    ? Id | ExtractPathVars<`/${Rest}`>
    : T extends `/{${infer Id}}`
    ? Id
    : T extends `/${infer _Start}/${infer Rest}`
    ? ExtractPathVars<`/${Rest}`>
    : never;

type DetectVarType<T extends string> = T extends `${infer _Start}Id` ? number : string;

type PathVars<Path extends string, Vars extends string = ExtractPathVars<Path>> = {
    [V in Vars]: DetectVarType<V>;
};

export const generatePath = <T extends Paths>(path: T, vars: PathVars<T>): string =>
    Object.entries(vars).reduce((prev, curr) => prev.replace(`{${curr[0]}}`, String(curr[1])), String(path));

export const pageHrefs = {
    user: (userId: number): string => generatePath(Paths.USER, { userId }),
};
