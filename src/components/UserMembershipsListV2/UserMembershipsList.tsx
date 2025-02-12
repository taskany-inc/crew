import { FC, HTMLAttributes } from 'react';
import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { List, ListItem } from '../List/List';
import { MembershipItem } from '../MembershipItem/MembershipItem';
import { Link } from '../Link';
import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { UserWithMemberships } from '../../modules/userTypes';

import { tr } from './UserMembershipsListV2.i18n';

interface UserMembershipsListProps extends HTMLAttributes<HTMLDivElement> {
    user?: UserWithMemberships;
}

export const UserMembershipsList: FC<UserMembershipsListProps> = ({ user, className, ...props }) => {
    const { showGroupPreview } = usePreviewContext();

    return (
        <div className={className} {...props}>
            <TeamPageSubtitle size="m" counter={user?.memberships.length ?? 0}>
                {tr('Teams with membership')}
            </TeamPageSubtitle>
            {nullable(
                user?.memberships,
                (ms) => (
                    <List>
                        {ms.map((m, index) => (
                            <ListItem key={index}>
                                <Link onClick={() => showGroupPreview(m.group.id)} href={pages.team(m.group.id)}>
                                    <MembershipItem membership={m} />
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                ),
                <Text>{tr('Not provided')}</Text>,
            )}
        </div>
    );
};
