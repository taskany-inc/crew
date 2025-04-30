import { nullable } from '@taskany/bricks';
import { Button, Text } from '@taskany/bricks/harmony';
import { IconExclamationCircleSolid, IconUserOutline, IconFileOutline, IconXSmallOutline } from '@taskany/icons';
import cn from 'classnames';

import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { useSameNameCheck } from '../../modules/userHooks';
import { useBoolean } from '../../hooks/useBoolean';
import { getRequestPageLinkByType } from '../../utils/userCreationRequests';

import { tr } from './SameNameAlert.i18n';
import s from './SameNameAlert.module.css';

interface SameNameAlertProps {
    surname?: string;
    firstName?: string;
    middleName?: string;
    className?: string;
}

export const SameNameAlert = ({ surname, firstName, middleName, className }: SameNameAlertProps) => {
    const hideAlert = useBoolean(false);

    const sameNameQuery = useSameNameCheck({ surname, firstName, middleName });

    if (
        hideAlert.value ||
        !sameNameQuery.data ||
        sameNameQuery.data.users.length + sameNameQuery.data.requests.length === 0
    ) {
        return null;
    }

    return (
        <div className={cn(s.SameNameAlert, className)}>
            <div className={s.Title}>
                <Text weight="bold">
                    <IconExclamationCircleSolid size="s" className={s.Icon} />
                    {tr('Profiles with the same name are found')}
                </Text>
                <Button size="xs" view="ghost" iconLeft={<IconXSmallOutline size="s" />} onClick={hideAlert.setTrue} />
            </div>
            <div className={s.Content}>
                {nullable(sameNameQuery.data.users, (u) => (
                    <div className={s.List}>
                        <Text>{tr('Please check the profiles for potential duplicates:')}</Text>
                        {u.map((user) => (
                            <Link key={user.id} href={pages.user(user.id)} target="_blank" className={s.ListItem}>
                                <IconUserOutline size="s" /> {user.name}
                            </Link>
                        ))}
                    </div>
                ))}
                {nullable(sameNameQuery.data.requests, (r) => (
                    <div className={s.List}>
                        <Text>{tr('Name mentions in requests:')}</Text>
                        {r.map((request) => (
                            <Link
                                key={request.id}
                                href={getRequestPageLinkByType(request.id, request.type)}
                                target="_blank"
                                className={s.ListItem}
                            >
                                <IconFileOutline size="s" /> {request.name}
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
