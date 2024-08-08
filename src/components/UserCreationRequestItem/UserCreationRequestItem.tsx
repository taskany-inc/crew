import { nullable, Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';

import { UserRequest } from '../../trpc/inferredTypes';
import { useSessionUser } from '../../hooks/useSessionUser';
import { Restricted } from '../Restricted';
import { formatDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { UserCreationRequestEditMenu } from '../UserCreationRequestEditMenu/UserCreationRequestEditMenu';

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
    const sessionUser = useSessionUser();
    const locale = useLocale();

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

                <Restricted visible={!!sessionUser.role?.editUserCreationRequests && request.status !== 'Denied'}>
                    <div className={s.Icon}>
                        <UserCreationRequestEditMenu request={request} />
                    </div>
                </Restricted>
            </div>
            {nullable(request.date, (date) => (
                <Text color={gray9}>
                    {tr('Date')}: {formatDate(date, locale)}
                </Text>
            ))}
        </div>
    );
};
