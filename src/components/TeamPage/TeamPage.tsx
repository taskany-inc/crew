import React from 'react';
import { Breadcrumb, Breadcrumbs, Button } from '@taskany/bricks/harmony';
import { IconEdit1Outline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { TeamPageLayout } from '../TeamPageLayout/TeamPageLayout';
import { TeamPageTitle } from '../TeamPageTitle/TeamPageTitle';
import { TeamPageDecription } from '../TeamPageDecription/TeamPageDecription';
import { TeamMembers } from '../TeamMembers/TeamMembers';
import { TeamChildren } from '../TeamChildren/TeamChildren';
import { TeamVacancies } from '../TeamVacanciesV2/TeamVacancies';
import { TeamSupervisor } from '../TeamSupervisor/TeamSupervisor';
import { Link } from '../Link';
import { pages, useRouter } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { useAppConfig } from '../../contexts/appConfigContext';

import s from './TeamPage.module.css';
import { tr } from './TeamPage.i18n';

interface TeamPageProps {
    teamId: string;
}

export const TeamPage = ({ teamId }: TeamPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    const group = groupQuery.data;
    const { teamSettings } = useRouter();
    const { showGroupPreview } = usePreviewContext();

    const childrenQuery = trpc.group.getChildren.useQuery(teamId);
    const { data: counter } = trpc.group.getTreeMembershipsCount.useQuery(teamId);
    const breadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(teamId);
    const appConfig = useAppConfig();

    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageLayout sidebar={<TeamMembers showAvatar groupId={group.id} editable={group.meta.isEditable} />}>
                {nullable(breadcrumbsQuery.data, (breadcrumbs) => (
                    <Breadcrumbs className={s.TeamPageBreadcrumbs}>
                        {breadcrumbs.map((b) => (
                            <Breadcrumb key={b.id}>
                                {b.id === appConfig?.orgGroupId ? (
                                    <Link href={pages.teams}>{tr('Teams')}</Link>
                                ) : (
                                    <Link href={pages.team(b.id)} onClick={() => showGroupPreview(b.id)}>
                                        {b.name}
                                    </Link>
                                )}
                            </Breadcrumb>
                        ))}
                    </Breadcrumbs>
                ))}
                <TeamPageTitle
                    counter={counter}
                    action={nullable(group.meta.isEditable, () => (
                        <Button
                            iconLeft={<IconEdit1Outline size="s" />}
                            text={tr('Edit')}
                            onClick={() => teamSettings(group.id)}
                        />
                    ))}
                >
                    {group.name}
                </TeamPageTitle>
                <TeamSupervisor supervisor={group.supervisor ?? undefined} />
                <TeamPageDecription value={group.description ?? undefined} />
                <div className={s.TeamPageLists}>
                    <TeamChildren items={childrenQuery.data ?? []} />
                    <TeamVacancies group={group} editable={group.meta.isEditable} />
                </div>
            </TeamPageLayout>
        </LayoutMain>
    );
};
