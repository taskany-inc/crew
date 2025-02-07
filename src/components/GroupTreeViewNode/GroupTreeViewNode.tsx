import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Group, User } from 'prisma/prisma-client';
import { nullable, TreeViewNode } from '@taskany/bricks';
import { User as HarmonyUser, Text, Tag, Badge, Button } from '@taskany/bricks/harmony';
import { IconCostEstimateOutline, IconSearchOutline, IconUsersOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';
import { Branch, Heading } from '../StructTreeView/StructTreeView';
import { GroupTree } from '../../trpc/inferredTypes';
import { GroupMemberList } from '../GroupMemberList/GroupMemberList';
import { TooltipIcon } from '../TooltipIcon';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';

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

type BaseGroup = Exclude<GroupTree[string]['group'], null | void | undefined>;
type GroupChidlren = GroupTree[string]['childs'];
type GroupTreeNode = BaseGroup & { childs: GroupChidlren };

interface GroupTreeTitle {
    name: string;
    id: string;
    supervisorName?: string | null;
    supervisorId: string | null;
    memberships?: number | null;
    vacancies?: number | null;
}

const NewGroupRow: React.FC<GroupTreeTitle & { firstLevel?: boolean }> = ({
    name,
    id,
    supervisorName,
    memberships,
    vacancies,
    firstLevel,
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
        </div>
    );
};

export const NewGroupTreeViewNode: React.FC<GroupTreeNode & { firstLevel?: boolean }> = ({
    id,
    supervisorId,
    supervisor,
    name,
    counts,
    childs,
    firstLevel,
}) => {
    const groupMembersQuery = trpc.group.getMemberships.useQuery(id, { enabled: false });

    const [isOpen, setIsOpen] = useState(false);

    const memberToRender = useMemo(() => {
        if (groupMembersQuery.data == null) {
            return null;
        }

        const membersWithoutSupervisor = groupMembersQuery.data
            .filter(({ user }) => user.id !== supervisorId)
            .map(({ user, roles: [role] }) => {
                const {
                    positions: [position],
                } = getLastSupplementalPositions(user.supplementalPositions);
                return {
                    id: user.id,
                    name: user.name,
                    employment: position.organizationUnit.name,
                    role: role?.name,
                    isSupervisor: false,
                };
            });
        const supervisorMember = groupMembersQuery.data.find(({ user }) => user.id === supervisorId);

        if (supervisorMember) {
            const {
                positions: [position],
            } = getLastSupplementalPositions(supervisorMember.user.supplementalPositions);
            return [
                {
                    id: supervisorMember.user.id,
                    name: supervisorMember.user.name,
                    employment: position.organizationUnit.name,
                    role: supervisorMember.roles[0].name,
                    isSupervisor: true,
                },
            ].concat(membersWithoutSupervisor);
        }

        return membersWithoutSupervisor;
    }, [supervisorId, groupMembersQuery.data]);

    const isLoading = useMemo(() => {
        const isLoading = groupMembersQuery.status === 'loading';
        const isIdle = groupMembersQuery.fetchStatus === 'idle';
        return !isIdle && isLoading;
    }, [groupMembersQuery]);

    const currentLevelChilds = useMemo(() => {
        if (childs == null) {
            return null;
        }
        const keys = Object.keys(childs);

        if (keys.length === 1) {
            return [childs[keys[0]]];
        }

        return keys.map((k) => childs[k]);
    }, [childs]);

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
                    await groupMembersQuery.refetch().then((res) => {
                        setIsOpen((res.data?.length || 0) > 0);
                    });

                    return;
                }
            }

            if (currentLevelChilds != null) {
                setIsOpen(currentLevelChilds.length > 0);
            }
        },
        [groupMembersQuery, isOpen, counts, currentLevelChilds],
    );

    const commonGroupCounts = useMemo(() => {
        if (childs == null) {
            return counts;
        }

        const stack = Object.keys(childs).map((k) => childs[k]);
        const accums = { memberships: counts?.memberships ?? 0, vacancies: counts?.vacancies ?? 0 };

        while (stack.length) {
            const { group, childs } = stack.pop() || {};

            if (group == null) {
                break;
            }

            if (childs != null) {
                stack.push(...Object.keys(childs).map((k) => childs[k]));
            }

            accums.memberships += group.counts?.memberships ?? 0;
            accums.vacancies += group.counts?.vacancies ?? 0;
        }

        return accums;
    }, [childs, counts]);

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
                        memberships={commonGroupCounts?.memberships}
                        vacancies={commonGroupCounts?.vacancies}
                        firstLevel={firstLevel}
                    />
                </Heading>
            }
        >
            {nullable(memberToRender, (list) => (
                <GroupMemberList members={list} />
            ))}

            {nullable(currentLevelChilds, (data) =>
                data.map(({ group, childs }) =>
                    nullable(group, (gr) => <NewGroupTreeViewNode key={gr.id} {...gr} childs={childs} />),
                ),
            )}
        </Branch>
    );
};
