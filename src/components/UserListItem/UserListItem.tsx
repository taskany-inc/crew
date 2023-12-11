import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray8, textColor } from '@taskany/colors';
import { User } from 'prisma/prisma-client';

import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { Link } from '../Link';
import { UserPic } from '../UserPic';

import { tr } from './UserListItem.i18n';

type UserListItemProps = {
    user: User;
};

const StyledWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    gap: ${gapS};
    align-items: center;
`;

export const UserListItem = ({ user }: UserListItemProps) => {
    const { showUserPreview } = usePreviewContext();

    return (
        <StyledWrapper>
            <UserPic size={20} user={user} />
            <Text color={user.active ? textColor : gray8}>
                <Link href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                    {user.name}
                    {!user.active && tr(' [inactive]')}
                </Link>
            </Text>
        </StyledWrapper>
    );
};
