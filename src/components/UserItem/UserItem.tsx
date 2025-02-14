import { ComponentProps, FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Avatar, Text } from '@taskany/bricks/harmony';

import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { Link } from '../Link';
import { UserContacts } from '../UserContactsV2/UserContactsV2';

import s from './UserItem.module.css';

type Size = 'm' | 'l';

interface UserItemProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
    size?: Size;
    showAvatar?: boolean;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

export const UserItem: FC<UserItemProps> = ({ className, user, size = 'l', showAvatar, ...rest }) => {
    const mainPosition = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions.find((item) => item.main);
    }, [user]);

    const { showUserPreview } = usePreviewContext();

    return (
        <div
            className={cn(
                s.UserItem,
                {
                    [s.UserItem_L]: size === 'l',
                    [s.UserItem_M]: size === 'm',
                },
                className,
            )}
            {...rest}
        >
            <div className={s.UserItemContent}>
                <div className={s.UserInfo}>
                    {nullable(showAvatar, () => (
                        <Link href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                            <Avatar
                                size={size === 'm' ? 'ml' : 'l'}
                                email={user.email}
                                name={user.name}
                                src={user.image}
                            />
                        </Link>
                    ))}
                    <div className={s.UserInfoContent}>
                        <div className={s.UserPersonalInfo}>
                            <Link href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                                <Text className={cn(s.UserName, s.UserInfoText)} size={textSizesMap[size]}>
                                    {user.name}
                                </Text>
                            </Link>
                            {nullable(mainPosition, (p) => (
                                <>
                                    <Text className={s.UserInfoText} size={textSizesMap[size]}>
                                        {p.role}
                                    </Text>
                                    <Text className={s.UserInfoText} size={textSizesMap[size]}>
                                        {p.organizationUnit.name}
                                    </Text>
                                </>
                            ))}
                        </div>
                        <UserContacts user={user} size={size} />
                    </div>
                </div>
            </div>
        </div>
    );
};
