import { useMemo } from 'react';
import { FiltersApplied } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';

import { useUserActivityFilterUrlParams } from '../../hooks/useUserActivityFilter';
import { formatDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';

import { tr } from './UserActivityFilterApplied.i18n';

export const UserActivityFilterApplied = () => {
    const {
        values: { from, to },
    } = useUserActivityFilterUrlParams();
    const locale = useLocale();

    const appliedString = useMemo(() => {
        let result = '';
        if (from) result += `${tr('Start of period')}: ${formatDate(new Date(from), locale)}. `;
        if (to) result += `${tr('End of period')}: ${formatDate(new Date(to), locale)}. `;
        return result;
    }, [locale, from, to]);

    return (
        <FiltersApplied size="s" weight="bold" color={gray7}>
            {appliedString}
        </FiltersApplied>
    );
};
