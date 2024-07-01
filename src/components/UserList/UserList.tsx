import { User } from '@prisma/client';
import { ReactNode } from 'react';
import { gray9 } from '@taskany/colors';
import { Text, UserPic, nullable } from '@taskany/bricks';

import s from './UserList.module.css';
import { tr } from './UserList.i18n';

interface UserListProps {
    title?: string;
    titleFragment?: ReactNode;
    users: User[];
    action?: {
        icon: ReactNode;
        handler: (user: User) => void;
        disabled?: boolean;
    };
}

export const UserList = ({ title, titleFragment, users, action }: UserListProps) => {
    return (
        <div className={s.Wrapper}>
            {(title || titleFragment) && (
                <div className={s.TitleWrapper}>
                    <Text size="xl" className={s.Title}>
                        {title}
                    </Text>
                    {titleFragment}
                </div>
            )}
            <div className={s.CardsContainer}>
                {nullable(users.length === 0, () => (
                    <Text color={gray9} className={s.TextMessage}>
                        {tr('No users')}
                    </Text>
                ))}
                {users.map((user) => (
                    <div className={s.UserCard} key={user.id}>
                        <UserPic name={user.name} email={user.email} />
                        <Text>{user.name}</Text>
                        {action && (
                            <button className={s.Icon} disabled={action.disabled} onClick={() => action.handler(user)}>
                                {action.icon}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
