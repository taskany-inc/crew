import { ComponentProps, FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { UserItem } from '../UserItem/UserItem';

import { tr } from './TeamSupervisor.i18n';
import s from './TeamSupervisor.module.css';

interface TeamPageSubtitleProps extends HTMLAttributes<HTMLDivElement> {
    supervisor?: ComponentProps<typeof UserItem>['user'];
    size?: 'l' | 'm';
}

export const TeamSupervisor: FC<TeamPageSubtitleProps> = ({ supervisor, className, size = 'l', ...rest }) => (
    <div className={className} {...rest}>
        <TeamPageSubtitle size={size}>{tr('Supervisor')}</TeamPageSubtitle>
        {nullable(
            supervisor,
            (sp) => (
                <UserItem
                    showAvatar
                    size={size}
                    className={cn({
                        [s.TeamSupervisorUser_L]: size === 'l',
                        [s.TeamSupervisorUser_M]: size === 'm',
                    })}
                    user={sp}
                />
            ),
            <Text className={s.TeamSupervisorEmpty}>{tr('Not provided')}</Text>,
        )}
    </div>
);
