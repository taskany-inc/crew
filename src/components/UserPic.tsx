import { UserPic as TaskanyUserPic } from '@taskany/bricks';
import styled from 'styled-components';

const StyledUserPic = styled(TaskanyUserPic)<{ deactivated: boolean }>`
    ${({ deactivated: decativated }) => decativated && 'filter: grayscale(100%);'}
`;

interface UserPicProps {
    user: { name: string | null; image?: string | null; email: string; active: boolean };
    size: number;
}

export const UserPic = ({ user, size }: UserPicProps) => (
    <StyledUserPic size={size} name={user.name} src={user.image} email={user.email} deactivated={!user.active} />
);
