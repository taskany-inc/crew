import { Text, nullable } from '@taskany/bricks';
import { gray10, gray9 } from '@taskany/colors';

import { MembershipInfo } from '../modules/user.types';

import { tr } from './components.i18n';
import { GroupListItem } from './groups/GroupListItem';

type MembershipGroupListItemProps = {
    membership: MembershipInfo;
};

export const MembershipGroupListItem = ({ membership }: MembershipGroupListItemProps) => {
    return (
        <div>
            <GroupListItem group={membership.group} />

            {nullable(membership.roles, (roles) => (
                <div>
                    <Text size="s" color={gray10}>
                        <Text size="s" as="span" color={gray9}>
                            {tr('Role')}:
                        </Text>{' '}
                        {roles.map((role) => role.name).join(', ')}
                    </Text>
                </div>
            ))}
        </div>
    );
};
