import React from 'react';
import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { TeamPageLayout } from '../TeamPageLayout/TeamPageLayout';
import { TeamPageTitle } from '../TeamPageTitle/TeamPageTitle';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { UserItem } from '../UserItem/UserItem';
import { TeamPageDecription } from '../TeamPageDecription/TeamPageDecription';
import { TeamMembers } from '../TeamMembers/TeamMembers';
import { TeamChildren } from '../TeamChildrenV2/TeamChildren';
import { TeamVacancies } from '../TeamVacanciesV2/TeamVacancies';

import { tr } from './TeamPage.i18n';
import s from './TeamPage.module.css';

interface TeamPageProps {
    teamId: string;
}

export const TeamPage = ({ teamId }: TeamPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    const group = groupQuery.data;

    const childrenQuery = trpc.group.getChildren.useQuery(teamId);
    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageLayout sidebar={<TeamMembers groupId={group.id} editable={group.meta.isEditable} />}>
                <TeamPageTitle counter={17} groupId={group.id} editable={group.meta.isEditable}>
                    {group.name}
                </TeamPageTitle>
                <div>
                    <TeamPageSubtitle>{tr('Supervisor')}</TeamPageSubtitle>
                    {nullable(
                        group.supervisor,
                        (supervisor) => (
                            <UserItem className={s.TeamSupervisor} user={supervisor} />
                        ),
                        <Text className={s.TeamSupervisorEmpty}>{tr('Not provided')}</Text>,
                    )}
                </div>

                <TeamPageDecription value={group.description ?? undefined} />
                <div className={s.TeamPageLists}>
                    <TeamChildren items={childrenQuery.data ?? []} />
                    <TeamVacancies group={group} editable={group.meta.isEditable} />
                </div>
            </TeamPageLayout>
        </LayoutMain>
    );
};
