import { useMemo } from 'react';
import { Group } from 'prisma/prisma-client';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { Dropdown, TabsMenu, TabsMenuItem, nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import { gapL, gray8 } from '@taskany/colors';
import { IconMoreHorizontalOutline } from '@taskany/icons';

import { GroupMeta, GroupParent } from '../../modules/groupTypes';
import { CommonHeader } from '../CommonHeader';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { GroupBreadcrumbListItem } from '../GroupBreadcrumbListItem';
import { OrganizationUserGroupSwitch } from '../OrganizationUserGroupSwitch/OrganizationUserGroupSwitch';
import { useAppConfig } from '../../contexts/appConfigContext';
import { formatDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';

import s from './TeamPageHeader.module.css';
import { tr } from './TeamPageHeader.i18n';

interface TeamPageHeaderProps {
    group: Group & GroupMeta & GroupParent;
}

const StyledTabsMenu = styled(TabsMenu)`
    margin: 0 ${gapL};
`;

const StyledDropdown = styled(Dropdown)`
    margin-bottom: -0.5rem;
`;

type Options = Array<[string, string]>;

export const TeamPageHeader = ({ group }: TeamPageHeaderProps) => {
    const router = useRouter();
    const locale = useLocale();

    const appConfig = useAppConfig();

    const breadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(group.id);
    const breadcrumbs = breadcrumbsQuery.data ?? [];

    const tabsMenuOptions = useMemo<Options>(() => {
        const options: Options = [[tr('Team'), pages.team(group.id)]];
        if (group.meta.isEditable) {
            options.push([tr('Settings'), pages.teamSettings(group.id)]);
        }
        return options;
    }, [group.id, group.meta.isEditable]);

    const isOrgGroup = group.id === appConfig?.orgGroupId;

    return (
        <>
            <CommonHeader
                subtitle={nullable(group.parent, (parent) => (
                    <>
                        <StyledDropdown
                            items={breadcrumbs}
                            placement="bottom-start"
                            arrow
                            renderTrigger={({ ref, onClick }) => (
                                <IconMoreHorizontalOutline size="s" color={gray8} ref={ref} onClick={onClick} />
                            )}
                            renderItem={({ item }) => <GroupBreadcrumbListItem breadcrumb={item} />}
                        />
                        <Link href={pages.team(parent.id)}>{parent.name}</Link>
                    </>
                ))}
                title={
                    <div className={s.TeamPageHeaderDate}>
                        {group.name}
                        {nullable(isOrgGroup && appConfig?.orgGroupUpdatedAt, (d) => (
                            <Text size="m">
                                {tr('Updated at:')} {formatDate(d, locale)}
                            </Text>
                        ))}
                    </div>
                }
                description={group.description}
            />

            {nullable(
                isOrgGroup,
                () => (
                    <OrganizationUserGroupSwitch value="org" />
                ),
                <StyledTabsMenu>
                    {tabsMenuOptions.map(([title, href]) => (
                        <Link key={title} href={href}>
                            <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                        </Link>
                    ))}
                </StyledTabsMenu>,
            )}
        </>
    );
};
