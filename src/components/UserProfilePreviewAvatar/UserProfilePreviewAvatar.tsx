import { FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Avatar, Button, Text } from '@taskany/bricks/harmony';
import { IconTopRightOutline } from '@taskany/icons';

import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { pages, useRouter } from '../../hooks/useRouter';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { Link } from '../Link';

import s from './UserProfilePreviewAvatar.module.css';
import { tr } from './UserProfilePreviewAvatar.i18n';

interface UserProfilePreviewAvatarProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
}

export const UserProfilePreviewAvatar: FC<UserProfilePreviewAvatarProps> = ({ className, user, ...rest }) => {
    const { user: goToUser } = useRouter();

    const mainPosition = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions.find((item) => item.main);
    }, [user]);

    return (
        <div className={cn(s.UserProfilePreviewAvatar, className)} {...rest}>
            <Avatar size="xl" email={user.email} name={user.name} src={user.image} />
            <div className={s.UserProfilePreviewAvatarInfo}>
                <Text weight="bold" size="lg">
                    {user.name}
                </Text>
                <div className={s.UserProfilePreviewAvatarPositionWrapper}>
                    <div className={s.UserProfilePreviewAvatarPosition}>
                        {nullable(mainPosition, (p) => (
                            <>
                                <Text size="m">{p.organizationUnit.name}</Text>
                                <Text size="m" weight="bold">
                                    {p.role}
                                </Text>
                            </>
                        ))}
                    </div>
                    <Link onClick={() => goToUser(user.id)} href={pages.user(user.id)}>
                        <Button view="ghost" text={tr('Show profile')} iconLeft={<IconTopRightOutline size="s" />} />
                    </Link>
                </div>
            </div>
        </div>
    );
};
