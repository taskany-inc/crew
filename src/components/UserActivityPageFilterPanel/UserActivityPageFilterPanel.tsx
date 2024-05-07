import { useRef, useState } from 'react';
import {
    FilterPopup,
    FiltersCounter,
    FiltersCounterContainer,
    FiltersMenuContainer,
    FiltersMenuItem,
    FiltersPanelContainer,
    FiltersPanelContent,
} from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';

import { DateRangeFilter } from '../DateRangeFilter/DateRangeFilter';
import { useUserActivityFilterUrlParams } from '../../hooks/useUserActivityFilter';
import { UserActivityFilterApplied } from '../UserActivityFilterApplied/UserActivityFilterApplied';

import s from './UserActivityPageFilterPanel.module.css';
import { tr } from './UserActivityPageFilterPanel.i18n';

interface UserActivityPageFilterPanelProps {
    count: number;
    total: number;
}

export const UserActivityPageFilterPanel = ({ count, total }: UserActivityPageFilterPanelProps) => {
    const filterRef = useRef<HTMLSpanElement>(null);
    const [filterVisible, setFilterVisible] = useState(false);

    const filter = useUserActivityFilterUrlParams();

    const [fromLocal, setFromLocal] = useState(filter.values.from);
    const [toLocal, setToLocal] = useState(filter.values.to);

    const isFilterEmpty = !filter.values.from && !filter.values.to;

    const onApplyClick = () => {
        filter.setter('from', fromLocal);
        filter.setter('to', toLocal);
    };

    const rangeWarning =
        fromLocal && toLocal && fromLocal > toLocal ? tr('End date is earlier than the start date') : undefined;

    return (
        <>
            <FiltersPanelContainer>
                <FiltersPanelContent>
                    <FiltersCounterContainer>
                        <FiltersCounter counter={count} total={total} />
                    </FiltersCounterContainer>
                    <FiltersMenuContainer>
                        <FiltersMenuItem
                            ref={filterRef}
                            active={isFilterEmpty}
                            onClick={() => setFilterVisible((v) => !v)}
                        >
                            {tr('Filter')}
                        </FiltersMenuItem>
                    </FiltersMenuContainer>
                    <Button text={tr('Reset')} className={s.ResetButton} onClick={filter.clearParams} />
                </FiltersPanelContent>
            </FiltersPanelContainer>

            <UserActivityFilterApplied />

            <FilterPopup
                applyButtonText={tr('Apply')}
                cancelButtonText={tr('Cancel')}
                visible={filterVisible}
                onApplyClick={onApplyClick}
                filterRef={filterRef}
                switchVisible={setFilterVisible}
            >
                <DateRangeFilter
                    defaultFrom={filter.values.from}
                    defaultTo={filter.values.to}
                    setFrom={(date) => setFromLocal(date)}
                    setTo={(date) => setToLocal(date)}
                    warningMessage={rangeWarning}
                />
            </FilterPopup>
        </>
    );
};
