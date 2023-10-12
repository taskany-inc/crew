import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { IconUsersOutline } from '@taskany/icons';
import { gapS, gapXs, gray10, gray9, textColor } from '@taskany/colors';

import { MembershipInfo } from '../modules/user.types';
import { usePreviewContext } from '../context/preview-context';
import { pages } from '../hooks/useRouter';

import { Link } from './Link';
import { tr } from './components.i18n';

type UserGroupListItemProps = {
    membership: MembershipInfo;
};

const StyledLink = styled(Link)`
    margin-left: ${gapS};
    color: ${textColor};
`;

const StyledRoles = styled.div`
    display: flex;
    flex-direction: rows;
    gap: ${gapXs};
`;

export const UserGroupListItem = ({ membership }: UserGroupListItemProps) => {
    const { showGroupPreview } = usePreviewContext();

    return (
        <div>
            <IconUsersOutline size={13} color={gray9} />

            <StyledLink onClick={() => showGroupPreview(membership.group.id)} href={pages.team(membership.groupId)}>
                {membership.group.name}
            </StyledLink>

            <StyledRoles>
                {membership.roles.length > 0 && (
                    <Text size="s" color={gray10}>
                        <Text size="s" as="span" color={gray9}>
                            {tr('Role')}:
                        </Text>{' '}
                        {membership.roles.map((role) => role.name).join(', ')}
                    </Text>
                )}
            </StyledRoles>
        </div>
    );
};
