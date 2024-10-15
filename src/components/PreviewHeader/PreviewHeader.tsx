import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapM, gapS, gray10, gray8, textColor } from '@taskany/colors';
import { ModalHeader, Text, nullable } from '@taskany/bricks';

import { Link } from '../Link';
import { UserPic } from '../UserPic';

import { tr } from './PreviewHeader.i18n';

interface PreviewHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    preTitle?: React.ReactNode;
    children?: React.ReactNode;
    link: string;
    user?: User;
}

const StyledModalHeader = styled(ModalHeader)`
    display: flex;
    gap: ${gapM};
    top: 0;
    position: sticky;
    padding-bottom: ${gapM};
`;

const StyledTitle = styled(Text)`
    margin-top: ${gapS};
`;

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({ preTitle, title, subtitle, children, link, user }) => {
    return (
        <StyledModalHeader>
            {user && <UserPic size={75} user={user} />}

            <div>
                {nullable(preTitle, (pre) => (
                    <Text size="s" weight="bold" color={gray8}>
                        {pre}
                    </Text>
                ))}
                {nullable(subtitle, (sub) => (
                    <Text as="span" size="m" weight="bold" color={gray10}>
                        {sub}
                    </Text>
                ))}
                <StyledTitle size="l" weight="bold" color={user?.active === false ? gray8 : textColor}>
                    <Link href={link}>
                        {title} {user?.active === false && tr(' [inactive]')}
                    </Link>
                </StyledTitle>
            </div>

            {children}
        </StyledModalHeader>
    );
};
