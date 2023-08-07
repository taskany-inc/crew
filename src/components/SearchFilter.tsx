import { FC, useCallback } from 'react';
import { Input } from '@taskany/bricks';
import { debounce } from 'throttle-debounce';

export const SearchFilter: FC<{
    placeholder?: string;
    defaultValue?: string;
    onChange: (search: string) => void;
}> = ({ placeholder, defaultValue, onChange }) => {
    const debouncedSearchHandler = debounce(200, onChange);

    const onSearchInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => debouncedSearchHandler(e.currentTarget.value),
        [debouncedSearchHandler],
    );
    return <Input placeholder={placeholder} defaultValue={defaultValue} onChange={onSearchInputChange} />;
};
