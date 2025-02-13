import { useMemo, useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { useRouter } from 'next/router';
import { nullable } from '@taskany/bricks';
import {
    Badge,
    Tag,
    Text,
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    Switch,
    SwitchControl,
} from '@taskany/bricks/harmony';
import { IconMoreHorizontalOutline, IconSearchOutline, IconUsersOutline } from '@taskany/icons';

import { GroupMeta, GroupParent, GroupSupervisor } from '../../modules/groupTypes';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { GroupBreadcrumbListItem } from '../GroupBreadcrumbListItem';
import { OrganizationUserGroupSwitch } from '../OrganizationUserGroupSwitch/OrganizationUserGroupSwitch';
import { useAppConfig } from '../../contexts/appConfigContext';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../utils/dateTime';
import { TooltipIcon } from '../TooltipIcon';

import { tr } from './TeamPageHeader.i18n';
import s from './TeamPageHeader.module.css';

interface TeamPageHeaderProps {
    group: Group & GroupMeta & GroupParent & GroupSupervisor;
}

type Options = Array<[string, string]>;

export const TeamPageHeader = ({ group }: TeamPageHeaderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const appConfig = useAppConfig();

    const breadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(group.id);
    const countsQuery = trpc.group.getFunctionalGroupCounts.useQuery();
    const breadcrumbs = breadcrumbsQuery.data ?? [];
    const count = countsQuery.data;

    const tabsMenuOptions = useMemo<Options>(() => {
        const options: Options = [[tr('Team'), pages.team(group.id)]];
        if (group.meta.isEditable) {
            options.push([tr('Settings'), pages.teamSettings(group.id)]);
        }
        return options;
    }, [group.id, group.meta.isEditable]);

    const isOrgGroup = group.id === appConfig?.orgGroupId;

    return (
        <header className={s.TeamPageHeader}>
            {nullable(group.parent, (parent) => (
                <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <DropdownTrigger
                        className={s.TeamPageHeaderBreadcrumbsTrigger}
                        onClick={() => setIsOpen((p) => !p)}
                        size="m"
                        view="default"
                    >
                        <div className={s.TeamPageHeaderBreadcrumbsTriggerValue}>
                            <IconMoreHorizontalOutline size="s" />
                            <Link href={pages.team(parent.id)}>{parent.name}</Link>
                        </div>
                    </DropdownTrigger>
                    <DropdownPanel width={200}>
                        {breadcrumbs.map((item) => (
                            <GroupBreadcrumbListItem key={item.id} breadcrumb={item} />
                        ))}
                    </DropdownPanel>
                </Dropdown>
            ))}
            <div className={s.TeamPageHeaderInfo}>
                <Text size="xl" weight="bold">
                    {group.name}
                </Text>
                {nullable(group.supervisor, ({ name }) => (
                    <Tag className={s.TeamPageHeaderSupervisor} view="rounded" size="m" color="primary">
                        {name}
                    </Tag>
                ))}
                <Badge
                    className={s.GroupNameBadgeData}
                    iconLeft={
                        <TooltipIcon text={tr('Total membership count')} placement="top">
                            <IconUsersOutline size="s" />
                        </TooltipIcon>
                    }
                    text={String(count?.membership ?? 0)}
                    weight="regular"
                />
                <Badge
                    className={s.GroupNameBadgeData}
                    iconLeft={
                        <TooltipIcon text={tr('Total open vacancy count')} placement="top">
                            <IconSearchOutline size="s" />
                        </TooltipIcon>
                    }
                    text={String(count?.vacancy ?? 0)}
                    weight="regular"
                />
                {nullable(isOrgGroup && appConfig?.orgGroupUpdatedAt, (d) => (
                    <Text className={s.TeamPageHeaderUpdatedAt} size="m">
                        {tr
                            .raw('Updated at: {date}', {
                                date: formatDate(d, locale),
                            })
                            .join(' ')}
                    </Text>
                ))}
            </div>
            <div className={s.TeamPageHeaderTabs}>
                {nullable(
                    isOrgGroup,
                    () => (
                        <OrganizationUserGroupSwitch value="org" noGap />
                    ),
                    <Switch value={router.asPath}>
                        {tabsMenuOptions.map(([title, href]) => (
                            <Link key={title} href={href}>
                                <SwitchControl value={href} text={title} />
                            </Link>
                        ))}
                    </Switch>,
                )}
            </div>
        </header>
    );
};
