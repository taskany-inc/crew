import { typeToFlattenedError } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stringifyZodError = (e: typeToFlattenedError<any, string>) => {
    const fieldErrors = Object.entries(e.fieldErrors).map(([k, v]) => `${k} - ${v?.join(', ')}`);
    return [...e.formErrors, ...fieldErrors].join('\n');
};
