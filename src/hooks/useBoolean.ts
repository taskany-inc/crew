import { useCallback, useMemo, useState } from 'react';

export const useBoolean = (initialValue: boolean) => {
    const [value, setValue] = useState(initialValue);

    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);
    const toggle = useCallback(() => setValue((v) => !v), []);

    return useMemo(
        () => ({ value, setTrue, setFalse, toggle, setValue }),
        [value, setTrue, setFalse, toggle, setValue],
    );
};
