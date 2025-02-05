import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Text } from '@taskany/bricks/harmony';
import { IconUsersOutline } from '@taskany/icons';

import { GroupWithSupervisor } from '../../modules/groupTypes';

import s from './TeamItem.module.css';

interface TeamItemProps extends HTMLAttributes<HTMLDivElement> {
    item: GroupWithSupervisor;
}

export const TeamItem: FC<TeamItemProps> = ({ className, item, ...props }) => (
    <div className={cn(s.TeamItem, className)} {...props}>
        <div className={s.TeamItemHeader}>
            <Text size="m">{item.name}</Text>
            <div className={s.TeamCounter}>
                <IconUsersOutline size="s" />
                <Text size="s">5</Text>
            </div>
        </div>
        <Text size="m" className={s.TeamItemSupervisor}>
            {item.supervisor?.name}
        </Text>
    </div>
);
