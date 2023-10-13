import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM } from '@taskany/colors';
import { useSession } from 'next-auth/react';
import { UserMenu, Header, HeaderContent, HeaderLogo, HeaderNav, HeaderNavLink, HeaderMenu } from '@taskany/bricks';

import { GlobalSearch } from '../GlobalSearch';

import { PageHeaderLogo } from './PageHeaderLogo';
import { useHeaderMenu } from './useHeaderMenu';

const StyledNav = styled(HeaderNav)`
    display: flex;
    align-items: center;
`;

const HeaderSearch = styled.div`
    margin-left: ${gapM};
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
            menu={
                <HeaderMenu>
                    {/* TODO: https://github.com/taskany-inc/crew/issues/157 */}
                    <UserMenu onClick={() => {}} email={session.data?.user.email} />
                </HeaderMenu>
            }
            nav={
                <StyledNav>
                    {entityListMenuItems.map((item) => (
                        <NextLink key={item.path} href={item.path} passHref legacyBehavior>
                            <HeaderNavLink>{item.text}</HeaderNavLink>
                        </NextLink>
                    ))}
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
