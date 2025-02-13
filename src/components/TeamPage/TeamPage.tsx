import React from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconEdit1Outline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { TeamPageLayout } from '../TeamPageLayout/TeamPageLayout';
import { TeamPageTitle } from '../TeamPageTitle/TeamPageTitle';
import { TeamPageDescription } from '../TeamPageDescription/TeamPageDescription';
import { TeamMembers } from '../TeamMembers/TeamMembers';
import { TeamChildren } from '../TeamChildren/TeamChildren';
import { TeamVacancies } from '../TeamVacanciesV2/TeamVacancies';
import { TeamSupervisor } from '../TeamSupervisor/TeamSupervisor';
import { useRouter } from '../../hooks/useRouter';
import { TeamBreadcrumbs } from '../TeamBreadcrumbs/TeamBreadcrumbs';

import s from './TeamPage.module.css';
import { tr } from './TeamPage.i18n';

interface TeamPageProps {
    teamId: string;
}

export const TeamPage = ({ teamId }: TeamPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    const group = groupQuery.data;
    const { teamSettings } = useRouter();

    const childrenQuery = trpc.group.getChildren.useQuery(teamId);
    const { data: counter } = trpc.group.getTreeMembershipsCount.useQuery(teamId);

    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageLayout
                sidebar={
                    <TeamMembers
                        className={s.TeamMembers}
                        showAvatar
                        groupId={group.id}
                        editable={group.meta.isEditable}
                    />
                }
            >
                <TeamBreadcrumbs groupId={group.id} orgGroup="link" />
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
                <TeamPageDescription value={group.description ?? undefined} isEditable={false} groupId={group.id} />
                <div className={s.TeamPageLists}>
                    <TeamChildren items={childrenQuery.data ?? []} />
                    <TeamVacancies group={group} editable={group.meta.isEditable} />
                </div>
            </TeamPageLayout>
        </LayoutMain>
    );
};
