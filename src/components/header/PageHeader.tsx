import styled from 'styled-components';
import { gapM, gapL, gray9 } from '@taskany/colors';
import { useSession } from 'next-auth/react';
import { Text, UserMenu, Header, HeaderContent, HeaderLogo, HeaderNav, HeaderNavLink } from '@taskany/bricks';
import { IconSearchOutline } from '@taskany/icons';

import { PageHeaderLogo } from './PageHeaderLogo';
import { useHeaderMenu } from './useHeaderMenu';
import { tr } from './header.i18n';

const StyledNav = styled(HeaderNav)`
    margin-left: ${gapL};
    display: flex;
    align-items: center;
`;

const StyledText = styled(Text)`
    padding-left: ${gapL};
    font-size: 18px;
`;

const HeaderSearch = styled.div`
    margin-left: ${gapM};
    position: relative;
    top: 2px;
`;

export const PageHeader: React.FC = () => {
    const { entityListMenuItems } = useHeaderMenu();
    const session = useSession();

    return (
        <Header
            logo={
                <HeaderLogo>
                    <PageHeaderLogo />
                </HeaderLogo>
            }
            menu={<UserMenu onClick={() => {}} email={session.data?.user.email} />}
            nav={
                <StyledNav>
                    {entityListMenuItems.map((item, index) => (
                        // <NextLink>
                        <HeaderNavLink key={index + item.text} href={item.path}>
                            {item.text}
                        </HeaderNavLink>
                        // </NextLink>
                    ))}
                    <StyledText weight="bold">{tr('Explore')}</StyledText>
                    <HeaderSearch>
                        <IconSearchOutline size={15} color={gray9} />
                    </HeaderSearch>
                </StyledNav>
            }
        >
            <HeaderContent />
        </Header>
    );
};
