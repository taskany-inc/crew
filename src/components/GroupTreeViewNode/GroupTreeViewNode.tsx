import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Group, User } from 'prisma/prisma-client';
import { nullable, TreeViewNode } from '@taskany/bricks';
import { User as HarmonyUser, Text, Tag, Badge, Button, LineSkeleton } from '@taskany/bricks/harmony';
import { IconCostEstimateOutline, IconSearchOutline, IconUsersOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';
import { Branch, Heading } from '../StructTreeView/StructTreeView';
import { GroupTree } from '../../trpc/inferredTypes';
import { GroupMemberList } from '../GroupMemberList/GroupMemberList';
import { TooltipIcon } from '../TooltipIcon';
import { getMainPositionFromLasts } from '../../utils/supplementalPositions';
import { UserSupervisor } from '../../modules/userTypes';

import s from './GroupTreeViewNode.module.css';
import { tr } from './GroupTreeViewNode.i18n';

interface GroupTreeViewNodeProps {
    group: Group & { supervisor: User | null };
}

const GroupRow: React.FC<GroupTreeViewNodeProps> = ({ group }) => {
    const { showGroupPreview } = usePreviewContext();
    return (
        <Link className={s.Link} onClick={() => showGroupPreview(group.id)} href={pages.team(group.id)}>
            <div className={s.GroupRow}>
                <Text className={s.GroupName} size="l">
                    {group.name}
                </Text>
                <HarmonyUser email={group.supervisor?.email} name={group.supervisor?.name} />
            </div>
        </Link>
    );
};

export const GroupTreeViewNode: React.FC<GroupTreeViewNodeProps> = ({ group }) => {
    const childrenQuery = trpc.group.getChildren.useQuery(group.id);
    const childrenData = childrenQuery.data ?? [];

    return (
        <div className={s.TreeViewNodeContainer}>
            {nullable(
                childrenData,
                (children) => (
                    <TreeViewNode title={<GroupRow group={group} />}>
                        {children.map((child) => (
                            <GroupTreeViewNode key={child.id} group={child} />
                        ))}
                    </TreeViewNode>
                ),
                <div className={s.NoChildrenGroup}>
                    <GroupRow group={group} />
                </div>,
            )}
        </div>
    );
};

type BaseGroup = Exclude<NonNullable<GroupTree>['group'], null | void | undefined> & {
    supervisor?: UserSupervisor['supervisor'] | null;
    supervisorId?: string | null;
    counts: Record<string, number | undefined> | null;
};
type GroupChidlren = NonNullable<GroupTree>['children'];
type GroupTreeNode = Omit<
    BaseGroup,
    'archived' | 'createdAt' | 'updatedAt' | 'description' | 'parentId' | 'virtual' | 'organizational'
> & {
    childs: GroupChidlren;
};

interface GroupTreeTitle {
    name: string;
    id: string;
    supervisorName?: string | null;
    supervisorId?: string | null;
    memberships?: number | null;
    vacancies?: number | null;
}

const NewGroupRow: React.FC<GroupTreeTitle & { firstLevel?: boolean; hideDescription?: boolean }> = ({
    name,
    id,
    supervisorName,
    memberships,
    vacancies,
    firstLevel,
    hideDescription,
}) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const { showGroupPreview } = usePreviewContext();

    const handleOpenGroupPreview = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
        (event) => {
            event.stopPropagation();
            showGroupPreview(id);
        },
        [id, showGroupPreview],
    );

    return (
        <div className={s.GroupRow}>
            <Text className={s.GroupName_new} size="m" weight={firstLevel ? 'bold' : 'regular'}>
                {name}
            </Text>
            {nullable(supervisorName, (n) => (
                <Tag view="rounded" size="m" color="primary">
                    {n}
                </Tag>
            ))}
            <Badge
                className={s.GroupNameBadgeData}
                iconLeft={
                    <TooltipIcon text={tr('Membership count')} placement="top">
                        <IconUsersOutline size="s" />
                    </TooltipIcon>
                }
                text={String(memberships ?? 0)}
                weight="regular"
            />
            {nullable(vacancies != null, () => (
                <Badge
                    className={s.GroupNameBadgeData}
                    iconLeft={
                        <TooltipIcon text={tr('Vacancy count')} placement="top">
                            <IconSearchOutline size="s" />
                        </TooltipIcon>
                    }
                    text={String(vacancies ?? 0)}
                    weight="regular"
                />
            ))}

            {nullable(!hideDescription, () => (
                <Button
                    view="clear"
                    iconLeft={
                        <TooltipIcon text={tr('Details')} placement="top">
                            <IconCostEstimateOutline size="s" />
                        </TooltipIcon>
                    }
                    onClick={handleOpenGroupPreview}
                    ref={btnRef}
                />
            ))}
        </div>
    );
};

export const NewGroupTreeViewNode: React.FC<
    GroupTreeNode & {
        firstLevel?: boolean;
        orgId?: string;
        loading?: boolean;
        hideDescription?: boolean;
        organizational?: boolean;
    }
> = ({
    id,
    supervisorId,
    supervisor,
    name,
    counts,
    childs,
    firstLevel,
    loading,
    orgId,
    hideDescription,
    organizational,
}) => {
    const groupMembersQuery = trpc.group.getMemberships.useQuery(
        { groupId: id, filterByOrgId: orgId },
        { enabled: false, keepPreviousData: true, refetchOnWindowFocus: false },
    );

    const metaDataByGroupIds = trpc.group.getGroupMetaByIds.useQuery(
        {
            ids: (childs || []).map(({ id }) => id),
            filterByOrgId: orgId,
            organizational,
        },
        { enabled: false, keepPreviousData: true, refetchOnWindowFocus: false },
    );

    const [isOpen, setIsOpen] = useState(false);

    const memberToRender = useMemo(() => {
        if (groupMembersQuery.data == null) {
            return null;
        }

        const membersWithoutSupervisor = groupMembersQuery.data
            .filter(({ user }) => user.id !== supervisorId)
            .map(({ user, roles: [role] }) => {
                const position = getMainPositionFromLasts(user.supplementalPositions);

                return {
                    id: user.id,
                    name: user.name,
                    employment: position?.organizationUnit.name,
                    role: role?.name,
                    isSupervisor: false,
                };
            });

        const supervisorMember = groupMembersQuery.data.find(({ user }) => user.id === supervisorId);

        if (supervisorMember) {
            const position = getMainPositionFromLasts(supervisorMember.user.supplementalPositions);
            return [
                {
                    id: supervisorMember.user.id,
                    name: supervisorMember.user.name,
                    employment: position?.organizationUnit.name,
                    role: supervisorMember.roles[0]?.name,
                    isSupervisor: true,
                },
            ].concat(membersWithoutSupervisor);
        }

        return membersWithoutSupervisor;
    }, [supervisorId, groupMembersQuery.data]);

    const isLoading = useMemo(() => {
        const [membersIsLoading, memberIsIdle] = [
            groupMembersQuery.status === 'loading',
            groupMembersQuery.fetchStatus === 'idle',
        ];
        const [metaIsLoading, metaIsIdle] = [
            metaDataByGroupIds.status === 'loading',
            metaDataByGroupIds.fetchStatus === 'idle',
        ];
        return !(memberIsIdle && metaIsIdle) && (membersIsLoading || metaIsLoading);
    }, [groupMembersQuery, metaDataByGroupIds]);

    const startFetching = useCallback<React.MouseEventHandler<HTMLDivElement>>(
        async (event) => {
            if (event.metaKey || event.ctrlKey) {
                return;
            }
            if (isOpen) {
                setIsOpen(false);
                return;
            }

            if (counts) {
                if ((counts?.memberships || 0) > 0) {
                    await Promise.all([groupMembersQuery.refetch(), metaDataByGroupIds.refetch()]).then(([res]) => {
                        setIsOpen((res.data?.length || 0) > 0 || (childs?.length ?? 0) > 0);
                    });

                    return;
                }
            }

            if (childs != null) {
                setIsOpen(childs.length > 0);
            }
        },
        [groupMembersQuery, metaDataByGroupIds, isOpen, counts, childs],
    );

    if (loading) {
        return (
            <Branch
                disable
                title={
                    <Heading className={s.TreeViewNode_Title} loading>
                        <div className={s.GroupRow}>
                            {nullable(
                                name,
                                (n) => (
                                    <Text className={s.GroupName_new} size="m" weight={firstLevel ? 'bold' : 'regular'}>
                                        {n}
                                    </Text>
                                ),
                                <LineSkeleton size="m" width="25%" roundness="s" />,
                            )}

                            <LineSkeleton size="s" width="5ch" roundness="s" />
                            <LineSkeleton size="s" width="5ch" roundness="s" />
                        </div>
                    </Heading>
                }
            />
        );
    }

    return (
        <Branch
            className={s.TreeViewNode}
            isOpen={isOpen}
            disable={false}
            title={
                <Heading className={s.TreeViewNode_Title} loading={isLoading} onClick={startFetching}>
                    <NewGroupRow
                        name={name}
                        id={id}
                        supervisorId={supervisorId}
                        supervisorName={supervisor?.name}
                        memberships={counts?.memberships}
                        vacancies={counts?.vacancies}
                        firstLevel={firstLevel}
                        hideDescription={hideDescription}
                    />
                </Heading>
            }
        >
            {nullable(memberToRender, (list) => (
                <GroupMemberList members={list} />
            ))}

            {nullable(childs, (data) =>
                data.map(({ group, children }) =>
                    nullable(group, (gr) => (
                        <NewGroupTreeViewNode
                            key={gr.id}
                            {...gr}
                            orgId={orgId}
                            childs={children}
                            counts={metaDataByGroupIds.data?.[gr.id]?.counts ?? null}
                            supervisor={metaDataByGroupIds.data?.[gr.id]?.supervisor ?? null}
                            organizational={organizational}
                        />
                    )),
                ),
            )}
        </Branch>
    );
};
