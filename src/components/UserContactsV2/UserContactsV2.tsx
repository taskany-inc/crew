import { ComponentProps, FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Text } from '@taskany/bricks/harmony';
import { IconChatOutline, IconEnvelopeOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { UserWithSuplementalPositions } from '../../modules/userTypes';

import s from './UserContactsV2.module.css';

type Size = 'm' | 'l';

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

interface UserContactsProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
    size?: Size;
}

export const UserContacts: FC<UserContactsProps> = ({ user, className, size = 'l' }) => (
    <div
        className={cn(
            s.UserContacts,
            {
                [s.UserContacts_L]: size === 'l',
                [s.UserContacts_M]: size === 'm',
            },
            className,
        )}
    >
        {nullable(user.email, () => (
            <div className={s.UserContactsBadge}>
                <IconEnvelopeOutline className={s.UserContactsText} size="s" />
                <Text className={s.UserContactsText} title={user.email} lines={1} size={textSizesMap[size]} ellipsis>
                    {user.email}
                </Text>
            </div>
        ))}

        {nullable(user.login, () => (
            <div className={s.UserContactsBadge}>
                <IconChatOutline className={s.UserContactsText} size="s" />
                <Text
                    className={s.UserContactsText}
                    title={user.login ?? ''}
                    lines={1}
                    size={textSizesMap[size]}
                    ellipsis
                >
                    {user.login}
                </Text>
            </div>
        ))}
    </div>
);
