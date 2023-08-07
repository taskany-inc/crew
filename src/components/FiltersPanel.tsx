import { FC, ReactNode } from 'react';
import {
    FiltersCounter,
    FiltersCounterContainer,
    FiltersPanelContainer,
    FiltersPanelContent,
    FiltersSearchContainer,
} from '@taskany/bricks';

import { SearchFilter } from './SearchFilter';

export const FiltersPanel: FC<{ children?: ReactNode; loading?: boolean; total?: number; counter?: number }> = ({
    children,
    loading,
    total = 0,
    counter = 0,
}) => {
    return (
        <>
            <FiltersPanelContainer loading={loading}>
                <FiltersPanelContent>
                    <FiltersSearchContainer>
                        <SearchFilter placeholder={'Search'} onChange={() => {}} />
                    </FiltersSearchContainer>
                    <FiltersCounterContainer>
                        <FiltersCounter total={total} counter={counter} />
                    </FiltersCounterContainer>
                    {children}
                </FiltersPanelContent>
            </FiltersPanelContainer>
        </>
    );
};
