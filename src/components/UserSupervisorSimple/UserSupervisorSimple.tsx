import { FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';

import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { Link } from '../Link';

import { tr } from './UserSupervisorSimple.i18n';
import s from './UserSupervisorSimple.module.css';

interface UserSupervisorSimpleProps extends HTMLAttributes<HTMLDivElement> {
    user?: UserWithSuplementalPositions;
}

export const UserSupervisorSimple: FC<UserSupervisorSimpleProps> = ({ user, className, ...props }) => {
    const { showUserPreview } = usePreviewContext();
    const mainPosition = useMemo(() => {
        if (!user) {
            return null;
        }
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions.find((item) => item.main);
    }, [user]);

    return (
        <div className={cn(s.UserSupervisorSimple, className)} {...props}>
            <Text size="m" weight="bold" className={s.UserSupervisorSimpleTitle}>
                {tr('Supervisor')}
            </Text>
            {nullable(
                user,
                (u) => (
                    <Link className={s.UserItemContent} href={pages.user(u.id)} onClick={() => showUserPreview(u.id)}>
                        <Text size="s">{u.name}</Text>

                        {nullable(mainPosition, (p) => (
                            <Text size="s" className={s.UserSupervisorPosition}>
                                {p.role}
                            </Text>
                        ))}
                    </Link>
                ),
                <Text size="s">{tr('Not provided')}</Text>,
            )}
        </div>
    );
};
