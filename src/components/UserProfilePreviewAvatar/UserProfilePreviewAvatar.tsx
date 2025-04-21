import { FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Avatar, Button, Text } from '@taskany/bricks/harmony';
import { IconTopRightOutline } from '@taskany/icons';

import { UserWithSuplementalPositions, UserMemberships } from '../../modules/userTypes';
import { pages, useRouter } from '../../hooks/useRouter';
import { Link } from '../Link';
import { usePreviewContext } from '../../contexts/previewContext';
import { getOrgRoleAndMemberships } from '../../utils/getOrgRoleAndMemberships';

import s from './UserProfilePreviewAvatar.module.css';
import { tr } from './UserProfilePreviewAvatar.i18n';

interface UserProfilePreviewAvatarProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions & UserMemberships;
}

export const UserProfilePreviewAvatar: FC<UserProfilePreviewAvatarProps> = ({ className, user, ...rest }) => {
    const { hidePreview } = usePreviewContext();
    const { user: goToUser } = useRouter();

    const { orgRole, orgMembership } = useMemo(() => getOrgRoleAndMemberships(user), [user]);

    const onShowProfile = () => {
        goToUser(user.id);
        hidePreview();
    };

    return (
        <div className={cn(s.UserProfilePreviewAvatar, className)} {...rest}>
            <Avatar size="xl" email={user.email} name={user.name} src={user.image} />
            <div className={s.UserProfilePreviewAvatarInfo}>
                <Text weight="bold" size="lg">
                    {user.name}
                </Text>
                <div className={s.UserProfilePreviewAvatarPositionWrapper}>
                    <div className={s.UserProfilePreviewAvatarPosition}>
                        {nullable(orgMembership, (m) => (
                            <Text size="m">{m.group.name}</Text>
                        ))}
                        {nullable(orgRole, (r) => (
                            <Text size="m" weight="bold">
                                {r}
                            </Text>
                        ))}
                    </div>
                    <Link onClick={onShowProfile} href={pages.user(user.id)}>
                        <Button view="ghost" text={tr('Show profile')} iconLeft={<IconTopRightOutline size="s" />} />
                    </Link>
                </div>
            </div>
        </div>
    );
};
