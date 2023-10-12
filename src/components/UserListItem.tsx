import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text, UserPic } from '@taskany/bricks';
import { gapS } from '@taskany/colors';

import { pages } from '../hooks/useRouter';
import { usePreviewContext } from '../context/preview-context';

import { Link } from './Link';

type UserListItemProps = {
    user: User;
};

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

export const UserListItem = ({ user }: UserListItemProps) => {
    const { showUserPreview } = usePreviewContext();

    return (
        <StyledWrapper>
            <UserPic size={20} name={user.name} src={user.image} email={user.email} />
            <Text>
                <Link href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                    {user.name}
                </Link>
            </Text>
        </StyledWrapper>
    );
};
