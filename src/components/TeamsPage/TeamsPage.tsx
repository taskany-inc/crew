import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';
import { FormControl, FormControlInput, Text, Button } from '@taskany/bricks/harmony';
import { IconFilterOutline, IconSearchOutline, IconSortDownOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { GroupTree, MothershipGroup } from '../../trpc/inferredTypes';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { PageWrapper } from '../PageWrapper/PageWrapper';
import { GroupMemberList } from '../GroupMemberList/GroupMemberList';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';

import s from './TeamsPage.module.css';
import { tr } from './TeamsPage.i18n';

type ChildrenData = NonNullable<GroupTree[string]['childs']>[string];

interface TeamsPage {
    mothership: MothershipGroup;
}

export const TeamsPage: React.FC<TeamsPage> = ({ mothership }) => {
    const currentGroup = trpc.group.getById.useQuery(mothership.id);
    const groupTree = trpc.group.getGroupTree.useQuery(mothership.id);
    const groupMembersQuery = trpc.group.getMemberships.useQuery(mothership.id);

    const childrenData = useMemo(() => {
        if (groupTree.data == null) {
            return [];
        }

        return Object.values(groupTree.data).reduce<Array<ChildrenData>>((acc, group) => {
            if (group != null) {
                acc.push(group);
            }

            return acc;
        }, []);
    }, [groupTree.data]);

    const group = currentGroup.data ?? null;

    const memberToRender = useMemo(() => {
        if (groupMembersQuery.data == null || group == null) {
            return null;
        }

        const membersWithoutSupervisor = groupMembersQuery.data
            .filter(({ user }) => user.id !== group.supervisorId)
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
        const supervisorMember = groupMembersQuery.data.find(({ user }) => user.id === group.supervisorId);

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
    }, [group, groupMembersQuery.data]);

    if (group == null) {
        return null;
    }

    return (
        <LayoutMain pageTitle={group.name}>
            <PageWrapper header={<TeamPageHeader group={group} />}>
                <div className={s.TeamPageHeadingRow}>
                    <Text className={s.TeamPageHeading} size="lg" weight="bold">
                        {tr('Structure')}
                    </Text>
                    <div className={s.TeamPageHeadingControls}>
                        <Button view="default" iconLeft={<IconFilterOutline size="s" />} text={tr('Filters')} />
                        <Button iconLeft={<IconSortDownOutline size="s" />} text={tr('Sorting')} />
                        <FormControl>
                            <FormControlInput
                                iconLeft={<IconSearchOutline size="s" />}
                                outline
                                placeholder={tr('Search in structure')}
                            />
                        </FormControl>
                    </div>
                </div>
                <StructTreeView>
                    {nullable(memberToRender, (list) => (
                        <GroupMemberList members={list} />
                    ))}

                    {nullable(childrenData, (children) =>
                        children.map(({ group, childs }) =>
                            nullable(group, (gr) => (
                                <NewGroupTreeViewNode
                                    key={gr.id}
                                    name={gr.name}
                                    id={gr.id}
                                    supervisorId={gr.supervisorId}
                                    supervisor={gr.supervisor}
                                    counts={gr.counts}
                                    childs={childs}
                                    firstLevel
                                />
                            )),
                        ),
                    )}
                </StructTreeView>
            </PageWrapper>
        </LayoutMain>
    );
};
