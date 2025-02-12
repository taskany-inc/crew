import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Text } from '@taskany/bricks/harmony';
import { IconUsersOutline } from '@taskany/icons';

import { MembershipInfo } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';

import s from './MembershipItem.module.css';

interface MembershipItemProps extends HTMLAttributes<HTMLDivElement> {
    membership: MembershipInfo;
}

export const MembershipItem: FC<MembershipItemProps> = ({ className, membership, ...props }) => {
    const { data: counter } = trpc.group.getTreeMembershipsCount.useQuery(membership.group.id);

    return (
        <div className={cn(s.MembershipItem, className)} {...props}>
            <div className={s.MembershipItemHeader}>
                <Text size="s">{membership.group.name}</Text>
                <div className={s.MembershipItemCounter}>
                    <IconUsersOutline size="s" />
                    <Text size="s">{counter}</Text>
                </div>
            </div>
            <Text size="s" className={s.MembershipItemRoles}>
                {membership.roles.map((role) => role.name).join(', ')}
            </Text>
        </div>
    );
};
