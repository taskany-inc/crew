import { useMemo } from 'react';
import { Group } from 'prisma/prisma-client';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { Dropdown, TabsMenu, TabsMenuItem, nullable } from '@taskany/bricks';
import { gapL, gray8 } from '@taskany/colors';
import { IconMoreHorizontalOutline } from '@taskany/icons';

import { GroupMeta, GroupParent } from '../../modules/groupTypes';
import { CommonHeader } from '../CommonHeader';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { GroupBreadcrumbListItem } from '../GroupBreadcrumbListItem';

import s from './TeamSettingsPageHeader.module.css';
import { tr } from './TeamSettingsPageHeader.i18n';

interface TeamSettingsPageHeaderProps {
    group: Group & GroupMeta & GroupParent;
}

const StyledTabsMenu = styled(TabsMenu)`
    margin: 0 ${gapL};
`;

const StyledDropdown = styled(Dropdown)`
    margin-bottom: -0.5rem;
`;

type Options = Array<[string, string]>;

export const TeamSettingsPageHeader = ({ group }: TeamSettingsPageHeaderProps) => {
    const router = useRouter();

    const breadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(group.id);
    const breadcrumbs = breadcrumbsQuery.data ?? [];

    const tabsMenuOptions = useMemo<Options>(() => {
        const options: Options = [[tr('Team'), pages.team(group.id)]];
        if (group.meta.isEditable) {
            options.push([tr('Settings'), pages.teamSettings(group.id)]);
        }
        return options;
    }, [group.id, group.meta.isEditable]);

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
                title={<div className={s.TeamPageHeaderDate}>{group.name}</div>}
                description={group.description}
            />

            <StyledTabsMenu>
                {tabsMenuOptions.map(([title, href]) => (
                    <Link key={title} href={href}>
                        <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                    </Link>
                ))}
            </StyledTabsMenu>
        </>
    );
};
