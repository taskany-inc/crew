import { nullable } from '@taskany/bricks';
import { Button, Drawer, DrawerHeader, TextSkeleton } from '@taskany/bricks/harmony';
import { IconTopRightOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { pages, useRouter } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { TeamPageTitle } from '../TeamPageTitle/TeamPageTitle';
import { TeamPageDescription } from '../TeamPageDescription/TeamPageDescription';
import { TeamChildren } from '../TeamChildren/TeamChildren';
import { TeamMembers } from '../TeamMembers/TeamMembers';
import { TeamVacancies } from '../TeamVacanciesV2/TeamVacancies';
import { TeamSupervisor } from '../TeamSupervisor/TeamSupervisor';
import { Link } from '../Link';
import { TeamBreadcrumbs } from '../TeamBreadcrumbs/TeamBreadcrumbs';

import s from './TeamProfilePreview.module.css';
import { tr } from './TeamProfilePreview.i18n';

interface UserProps {
    groupId: string;
}

export const TeamProfilePreview = ({ groupId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const groupQuery = trpc.group.getById.useQuery(groupId);
    const childrenQuery = trpc.group.getChildren.useQuery(groupId);
    const { data: counter } = trpc.group.getTreeMembershipsCount.useQuery(groupId);

    const redirectActions = {
        goals: {
            id: groupId,
            text: tr('Goals redirect'),
        },
    };

    const { team } = useRouter();

    const onShowTeam = () => {
        team(groupId);
        hidePreview();
    };

    return (
        <Drawer animated visible onClose={hidePreview}>
            <DrawerHeader
                topBarContent={<TeamBreadcrumbs groupId={groupId} orgGroup="hide" className={s.TeamBreadcrumbs} />}
            >
                {nullable(groupQuery.data, (group) => (
                    <TeamPageTitle
                        counter={counter}
                        size="m"
                        redirectActions={redirectActions}
                        action={
                            <Link onClick={onShowTeam} href={pages.team(group.id)}>
                                <Button
                                    view="ghost"
                                    text={tr('Show team')}
                                    iconLeft={<IconTopRightOutline size="s" />}
                                />
                            </Link>
                        }
                    >
                        {group.name}
                    </TeamPageTitle>
                ))}
            </DrawerHeader>

            {nullable(
                groupQuery.data,
                (group) => (
                    <div className={s.TeamDrawerBody}>
                        <TeamSupervisor size="m" supervisor={group.supervisor ?? undefined} />

                        <TeamPageDescription
                            isEditable={group.meta.isEditable}
                            size="m"
                            value={group.description ?? undefined}
                            groupId={group.id}
                        />
                        <TeamChildren size="m" items={childrenQuery.data ?? []} />

                        <TeamMembers size="m" groupId={group.id} />

                        <TeamVacancies size="m" group={group} />
                    </div>
                ),
                <TextSkeleton lines={6} />,
            )}

            {/* <NarrowSection>
                            <Restricted visible={group.meta.isEditable}>
                                <TransferGroupForm group={group} />
                            </Restricted>

                            <Restricted
                                visible={
                                    group.meta.isEditable &&
                                    !childrenQuery.data?.length &&
                                    !groupQuery.data?.vacancies.length
                                }
                            >
                                <ArchiveGroupForm groupId={group.id} groupName={group.name} />
                            </Restricted>

                            <ExportTeamMembers group={group} />
                        </NarrowSection> */}
        </Drawer>
    );
};
