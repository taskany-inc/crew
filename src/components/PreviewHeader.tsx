import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapM, gray10, gray6 } from '@taskany/colors';
import { ModalHeader, Text, UserPic, nullable } from '@taskany/bricks';

interface PreviewHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    preTitle?: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    user?: User;
}

const StyledModalHeader = styled(ModalHeader)`
    display: flex;
    gap: ${gapM};
    top: 0;
    position: sticky;
    padding-bottom: ${gapM};
`;

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({ preTitle, title, subtitle, children, onClick, user }) => {
    return (
        <StyledModalHeader>
            <UserPic size={75} name={user?.name} src={user?.image} email={user?.email} />

            <div>
                {nullable(preTitle, (pre) => (
                    <Text size="s" weight="bold" color={gray6}>
                        {pre}
                    </Text>
                ))}
                {nullable(subtitle, (sub) => (
                    <Text as="span" size="l" weight="bold" color={gray10} onClick={onClick}>
                        {sub}
                    </Text>
                ))}
                <Text size="xl" weight="bold">
                    {title}
                </Text>
            </div>

            {children}
        </StyledModalHeader>
    );
};
