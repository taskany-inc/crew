import { useMemo, useRef } from 'react';
import NextLink from 'next/link';
import { UserMenu, Text, nullable } from '@taskany/bricks';
import {
    Popup,
    Header,
    HeaderNavLink,
    HeaderMenu,
    HeaderLogo,
    HeaderNav,
    HeaderContent,
} from '@taskany/bricks/harmony';
import { useRouter } from 'next/router';

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
import s from './PageHeader.module.css';

interface HeaderLink {
    path: string;
    text: string;
    visible: boolean;
}

export const PageHeader: React.FC<{ logo?: string; userSettings?: UserSettings }> = ({ logo, userSettings }) => {
    const sessionUser = useSessionUser();
    const appConfig = useAppConfig();
    const router = useRouter();

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

        return objKeys(scopesDescriptions())
            .filter((name) => role[name])
            .map((name) => scopesDescriptions()[name]);
    }, [sessionUser]);

    return (
        <Header
            logo={
                <HeaderLogo className={s.HeaderLogo}>
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
                                    <div>
                                        {descriptions.map((d) => (
                                            <Text size="xs" key={d} as="li">
                                                {d}
                                            </Text>
                                        ))}
                                    </div>
                                ))}
                            </>
                        ))}
                    </Popup>
                </HeaderMenu>
            }
            nav={
                <HeaderNav>
                    {entityListMenuItems.map((item) => (
                        <Restricted visible={item.visible} key={item.path}>
                            <NextLink href={item.path} passHref legacyBehavior>
                                <HeaderNavLink active={item.path === router.asPath}>{item.text}</HeaderNavLink>
                            </NextLink>
                        </Restricted>
                    ))}
                </HeaderNav>
            }
        >
            <HeaderContent>
                <div className={s.HeaderNav}>
                    <PageHeaderActionButton userSettings={userSettings} />
                    <GlobalSearch />
                </div>
            </HeaderContent>
        </Header>
    );
};
