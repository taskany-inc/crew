import { ComponentProps, FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Text } from '@taskany/bricks/harmony';
import { IconUsersOutline } from '@taskany/icons';

import { GroupWithSupervisor } from '../../modules/groupTypes';

import s from './TeamItem.module.css';

type Size = 'm' | 'l';

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'm',
};

interface TeamItemProps extends HTMLAttributes<HTMLDivElement> {
    item: GroupWithSupervisor;
    size?: Size;
}

export const TeamItem: FC<TeamItemProps> = ({ className, item, size = 'l', ...props }) => (
    <div
        className={cn(
            s.TeamItem,
            {
                [s.TeamItem_L]: size === 'l',
                [s.TeamItem_M]: size === 'm',
            },
            className,
        )}
        {...props}
    >
        <div className={s.TeamItemHeader}>
            <Text size={textSizesMap[size]}>{item.name}</Text>
            <div className={s.TeamCounter}>
                <IconUsersOutline size="s" />
                <Text size="s">5</Text>
            </div>
        </div>
        <Text size={textSizesMap[size]} className={s.TeamItemSupervisor}>
            {item.supervisor?.name}
        </Text>
    </div>
);
