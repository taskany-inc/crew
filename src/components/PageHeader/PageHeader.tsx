import { useMemo } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM } from '@taskany/colors';
import { useSession } from 'next-auth/react';
import { UserMenu, Header, HeaderContent, HeaderLogo, HeaderNav, HeaderNavLink, HeaderMenu } from '@taskany/bricks';

import { pages } from '../../hooks/useRouter';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';

import { tr } from './PageHeader.i18n';

const StyledNav = styled(HeaderNav)`
    display: flex;
    align-items: center;
`;

const HeaderSearch = styled.div`
    margin-left: ${gapM};
`;

type HeaderLink = { path: string; text: string };

type UseHeaderMenuResult = {
    entityListMenuItems: HeaderLink[];
};

const useHeaderMenu = (): UseHeaderMenuResult => {
    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [
            { path: pages.teams, text: tr('Teams') },
            { path: pages.users, text: tr('Users') },
        ];

        return items;
    }, []);

    return { entityListMenuItems };
};

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
                    <NextLink href={pages.userSettings}>
                        <UserMenu email={session.data?.user.email} />
                    </NextLink>
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
            <HeaderContent>
                <PageHeaderActionButton />
            </HeaderContent>
        </Header>
    );
};
