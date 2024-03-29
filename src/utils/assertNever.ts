export const assertNever = (_value: never) => {
    throw Error('This should never happen');
};
