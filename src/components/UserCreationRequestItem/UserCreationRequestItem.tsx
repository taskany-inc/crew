import { nullable, Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';

import { UserRequest } from '../../trpc/inferredTypes';

import s from './UserCreationRequestItem.module.css';
import { tr } from './UserCreationRequestItem.i18n';

interface UserCreationRequestItemProps {
    request: UserRequest;
}

export const UserCreationRequestItem = ({ request }: UserCreationRequestItemProps) => {
    const label =
        request.type === 'externalEmployee'
            ? tr('Access request for external employee')
            : tr('Request for planned employment');

    let status = tr('To be agreed');

    if (request.status === 'Approved') status = tr('Approved');

    if (request.status === 'Denied') status = tr('Denied');

    return (
        <div className={s.Wrapper}>
            <div className={s.Row}>
                <Text className={s.Text} size="l">
                    {label}
                </Text>
                <Text className={s.Text}>{request.name}</Text>
                <Text className={s.Text}>{status}</Text>
            </div>
            {nullable(request.date, (date) => (
                <Text color={gray9}>
                    {tr('Date')}: {date.toLocaleDateString()}
                </Text>
            ))}
        </div>
    );
};
