import { useMemo, useRef } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM } from '@taskany/colors';
import {
    UserMenu,
    Header,
    HeaderContent,
    HeaderLogo,
    HeaderNav,
    HeaderNavLink,
    HeaderMenu,
    Text,
    nullable,
} from '@taskany/bricks';
import { Popup } from '@taskany/bricks/harmony';

import { pages } from '../../hooks/useRouter';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { UserSettings } from '../../modules/userTypes';
import { useSessionUser } from '../../hooks/useSessionUser';
import { scopesDescriptions } from '../../utils/access';
import { objKeys } from '../../utils/objKeys';
import { Restricted } from '../Restricted';
import { useAppConfig } from '../../contexts/appConfigContext';

import { tr } from './PageHeader.i18n';

const StyledNav = styled(HeaderNav)`
    display: flex;
    align-items: center;
`;

const HeaderSearch = styled.div`
    margin-left: ${gapM};
`;

const StyledList = styled.ul`
    margin: 0;
    padding-left: ${gapM};
`;

interface HeaderLink {
    path: string;
    text: string;
    visible: boolean;
}

export const PageHeader: React.FC<{ logo?: string; userSettings?: UserSettings }> = ({ logo, userSettings }) => {
    const sessionUser = useSessionUser();
    const appConfig = useAppConfig();

    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [
            {
                path: appConfig?.orgGroupId ? pages.team(appConfig.orgGroupId) : pages.teams,
                text: tr('Teams'),
                visible: true,
            },
            { path: pages.users, text: tr('Users'), visible: true },

            { path: pages.logs, text: tr('Logs'), visible: !!sessionUser.role?.viewHistoryEvents },
            {
                path: sessionUser.role?.viewScheduledDeactivation
                    ? pages.scheduledDeactivations
                    : pages.accessCoordination,
                text: tr('Profiles management'),
                visible:
                    !!sessionUser.role?.readManyExternalUserRequests ||
                    !!sessionUser.role?.readManyExternalFromMainUserRequests ||
                    !!sessionUser.role?.readManyInternalUserRequests ||
                    !!sessionUser.role?.viewScheduledDeactivation,
            },
            {
                path: pages.adminPanel,
                text: tr('Admin panel'),
                visible: !!sessionUser.role?.editRoleScopes,
            },
        ];
        return items;
    }, [userSettings, appConfig]);

    const avatarRef = useRef<HTMLAnchorElement>(null);

    const roleDescriptions = useMemo(() => {
        const { role } = sessionUser;
        if (!role) return;

        return objKeys(scopesDescriptions)
            .filter((name) => role[name])
            .map((name) => scopesDescriptions[name]);
    }, [sessionUser]);

    return (
        <Header
            logo={
                <HeaderLogo>
                    <PageHeaderLogo logo={logo} />
                </HeaderLogo>
            }
            menu={
                <HeaderMenu>
                    <NextLink ref={avatarRef} href={pages.userSettings}>
                        <UserMenu name={sessionUser.name} email={sessionUser.email} />
                    </NextLink>
                    <Popup reference={avatarRef} interactive>
                        <Text>{sessionUser.name}</Text>
                        {nullable(sessionUser.role, (r) => (
                            <>
                                <Text size="s">
                                    {tr('User role')}: {r.name}
                                </Text>
                                {nullable(roleDescriptions, (descriptions) => (
                                    <StyledList>
                                        {descriptions.map((d) => (
                                            <Text size="xs" key={d} as="li">
                                                {d}
                                            </Text>
                                        ))}
                                    </StyledList>
                                ))}
                            </>
                        ))}
                    </Popup>
                </HeaderMenu>
            }
            nav={
                <StyledNav>
                    {entityListMenuItems.map((item) => (
                        <Restricted visible={item.visible} key={item.path}>
                            <NextLink href={item.path} passHref legacyBehavior>
                                <HeaderNavLink>{item.text}</HeaderNavLink>
                            </NextLink>
                        </Restricted>
                    ))}
                    <HeaderSearch>
                        <GlobalSearch />
                    </HeaderSearch>
                </StyledNav>
            }
        >
            <HeaderContent>
                <PageHeaderActionButton userSettings={userSettings} />
            </HeaderContent>
        </Header>
    );
};
