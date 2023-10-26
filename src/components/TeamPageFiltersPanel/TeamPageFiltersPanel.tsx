import { ReactNode } from 'react';
import {
    FiltersCounter,
    FiltersCounterContainer,
    FiltersPanelContainer,
    FiltersPanelContent,
    FiltersSearchContainer,
} from '@taskany/bricks';

import { SearchFilter } from '../SearchFilter';

import { tr } from './TeamPageFiltersPanel.i18n';

type TeamPageFilterPanelProps = {
    children?: ReactNode;
    loading?: boolean;
    total?: number;
    counter?: number;
};

export const TeamPageFiltersPanel = ({ children, loading, total = 0, counter = 0 }: TeamPageFilterPanelProps) => {
    return (
        <FiltersPanelContainer loading={loading}>
            <FiltersPanelContent>
                <FiltersSearchContainer>
                    <SearchFilter placeholder={tr('Search')} onChange={() => {}} />
                </FiltersSearchContainer>
                <FiltersCounterContainer>
                    <FiltersCounter total={total} counter={counter} />
                </FiltersCounterContainer>
                {children}
            </FiltersPanelContent>
        </FiltersPanelContainer>
    );
};
