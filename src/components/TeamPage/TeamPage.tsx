import React from 'react';
import { Button } from '@taskany/bricks/harmony';
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
import { useRouter } from '../../hooks/useRouter';

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
    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageLayout sidebar={<TeamMembers showAvatar groupId={group.id} editable={group.meta.isEditable} />}>
                <TeamPageTitle
                    counter={17}
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
