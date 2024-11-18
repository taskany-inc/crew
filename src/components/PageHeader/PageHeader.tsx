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
import { AccessOperation } from '../../utils/access';
import { objKeys } from '../../utils/objKeys';
import { Restricted } from '../Restricted';
import { config } from '../../config';

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
    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [
            { path: config.orgGroupId ? pages.team(config.orgGroupId) : pages.teams, text: tr('Teams'), visible: true },
            { path: pages.users, text: tr('Users'), visible: true },

            { path: pages.logs, text: tr('Logs'), visible: !!sessionUser.role?.viewHistoryEvents },
            {
                path:
                    sessionUser.role?.editUserCreationRequests || sessionUser.role?.createUser
                        ? pages.accessCoordination
                        : pages.scheduledDeactivations,
                text: tr('Profiles management'),
                visible:
                    !!sessionUser.role?.editUserCreationRequests ||
                    !!sessionUser.role?.viewScheduledDeactivation ||
                    !!sessionUser.role?.editScheduledDeactivation,
            },
            {
                path: pages.adminPanel,
                text: tr('Admin panel'),
                visible: !!sessionUser.role?.editRoleScopes,
            },
        ];
        return items;
    }, [userSettings]);

    const avatarRef = useRef<HTMLAnchorElement>(null);

    const roleDescriptions = useMemo(() => {
        const { role } = sessionUser;
        if (!role) return;
        const allDescriptions: Record<AccessOperation, string> = {
            editRoleScopes: tr('editing role scopes'),
            editUserRole: tr('editing user roles'),
            createUser: tr('creating users'),
            editUser: tr('editing users'),
            editUserCreationRequests: tr('user creation request'),
            editUserActiveState: tr('deactivating users'),
            editUserAchievements: tr('giving out achievements'),
            editUserBonuses: tr('editing user bonus points'),
            viewUserBonuses: tr('viewing user bonus points'),
            viewUserExtendedInfo: tr('viewing user extended info'),
            editScheduledDeactivation: tr('creating and editing scheduled deactivations'),
            viewScheduledDeactivation: tr('viewing scheduled deactivations'),

            editFullGroupTree: tr('editing any team'),

            viewHistoryEvents: tr('viewing history of changes'),

            importData: tr('import data from file'),
        };
        return objKeys(allDescriptions)
            .filter((name) => role[name])
            .map((name) => allDescriptions[name]);
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
