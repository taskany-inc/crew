import { FieldError, FieldErrorsImpl, FieldValues, Merge } from 'react-hook-form';

export const errorPicker = <T extends FieldValues>(
    errors: Merge<FieldError, (Merge<FieldError, FieldErrorsImpl<T>> | undefined)[]> | undefined,
    index: number,
    key: keyof T,
) => {
    if (!errors || !errors[index]) return;
    const { [key]: error } = errors[index];
    return error as { message?: string };
};
