import { Text } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';

import { formatDate } from '../utils/dateTime';
import { useLocale } from '../hooks/useLocale';

interface FormattedDateProps {
    date: Date;
}

export const FormattedDate = ({ date }: FormattedDateProps) => {
    const locale = useLocale();

    return <Text color={gray7}>{formatDate(date, locale)}</Text>;
};
