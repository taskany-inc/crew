import styled from 'styled-components';
import NextLink from 'next/link';
import { gapL } from '@taskany/colors';
import { useSession } from 'next-auth/react';
import { Text, UserMenu, Header, HeaderContent, HeaderLogo, HeaderNav, HeaderNavLink } from '@taskany/bricks';

import { GlobalSearch } from '../GlobalSearch';

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
    margin-left: ${gapL};
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
                    {entityListMenuItems.map((item) => (
                        <NextLink key={item.path} href={item.path} passHref legacyBehavior>
                            <HeaderNavLink>{item.text}</HeaderNavLink>
                        </NextLink>
                    ))}
                    <StyledText weight="bold">{tr('Explore')}</StyledText>
                    <HeaderSearch>
                        <GlobalSearch />
                    </HeaderSearch>
                </StyledNav>
            }
        >
            <HeaderContent />
        </Header>
    );
};
