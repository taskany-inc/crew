import { UserPic as TaskanyUserPic } from '@taskany/bricks';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';

const StyledUserPic = styled(TaskanyUserPic)<{ deactivated: boolean }>`
    ${({ deactivated: decativated }) => decativated && 'filter: grayscale(100%);'}
`;

interface UserPicProps {
    user: User;
    size: number;
}

export const UserPic = ({ user, size }: UserPicProps) => (
    <StyledUserPic size={size} name={user.name} src={user.image} email={user.email} deactivated={!user.active} />
);
