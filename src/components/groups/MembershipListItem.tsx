import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Dropdown, MenuItem, Text, UserPic } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { IconMoreVerticalOutline } from '@taskany/icons';

import { pages } from '../../hooks/useRouter';
import { UserMembership } from '../../modules/user.types';
import { Link } from '../Link';

import { tr } from './groups.i18n';
import { EditRolesModal } from './EditRolesModal';

type MembershipListItemProps = {
    membership: UserMembership;
};

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 28px 1fr 1fr 28px;
    width: 500px;
`;

export const MembershipListItem = ({ membership }: MembershipListItemProps) => {
    const [editRolesPopupVisible, setEditRolesPopupVisible] = useState(false);

    const items = useMemo(() => [{ name: tr('Edit roles'), action: () => setEditRolesPopupVisible(true) }], []);

    return (
        <StyledRow>
            <UserPic size={20} name={membership.user.name} src={membership.user.image} email={membership.user.email} />
            <Text>
                <Link href={pages.user(membership.user.id)}>{membership.user.name}</Link>
            </Text>
            <Text size="xs" color={gray9}>
                {membership.roles.map((role) => role.name).join(', ')}
            </Text>

            <Dropdown
                onChange={(v) => v.action()}
                items={items}
                renderTrigger={({ ref, onClick }) => (
                    <IconMoreVerticalOutline ref={ref} noWrap size="xs" onClick={onClick} />
                )}
                renderItem={({ item, cursor, index, onClick }) => (
                    <MenuItem key={item.name} ghost focused={cursor === index} onClick={onClick}>
                        {item.name}
                    </MenuItem>
                )}
            />

            <EditRolesModal
                visible={editRolesPopupVisible}
                membership={membership}
                onClose={() => setEditRolesPopupVisible(false)}
            />
        </StyledRow>
    );
};
