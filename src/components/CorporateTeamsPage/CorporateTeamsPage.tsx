import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';
import { FormControl, FormControlInput, Text, Button } from '@taskany/bricks/harmony';
import { IconFilterOutline, IconSearchOutline, IconSortDownOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup, OrganizationUnit } from '../../trpc/inferredTypes';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { PageWrapper } from '../PageWrapper/PageWrapper';
import { GroupMemberList } from '../GroupMemberList/GroupMemberList';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';

import s from './CorporateTeamsPage.module.css';
import { tr } from './TeamsPage.i18n';

interface CorporateTeamsPage {
    mothership: MothershipGroup;
}

const CorporateTreeNodeWrapper: React.FC<
    OrganizationUnit & { mothershipId: string; counts: Record<string, number> | null }
> = ({ id, name, counts }) => {
    const groupTreeQuery = trpc.group.getGroupTreeByOrgId.useQuery(id);

    return (
        <NewGroupTreeViewNode
            loading={groupTreeQuery.status === 'loading'}
            key={id}
            name={name}
            id={id}
            orgId={id}
            firstLevel
            counts={counts}
            childs={groupTreeQuery.data?.children}
            supervisorId={null}
            hideDescription
        />
    );
};

export const CorporateTeamsPage: React.FC<CorporateTeamsPage> = ({ mothership }) => {
    const currentGroup = trpc.group.getById.useQuery(mothership.id);
    const groupMembersQuery = trpc.group.getMemberships.useQuery({ groupId: mothership.id });
    const organizationUnits = trpc.organizationUnit.getAll.useQuery();
    const countsByOrgIds = trpc.organizationUnit.getCountsByOrgUnitIds.useQuery(
        (organizationUnits.data || []).map(({ id }) => id),
        { enabled: (organizationUnits.data?.length ?? 0) > 0 },
    );

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
                <div className={s.CorporateTeamPageHeadingRow}>
                    <Text className={s.CorporateTeamPageHeading} size="lg" weight="bold">
                        {tr('Structure')}
                    </Text>
                    <div className={s.CorporateTeamPageHeadingControls}>
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

                    {nullable(organizationUnits.data, (units) =>
                        units.map((unit) => (
                            <CorporateTreeNodeWrapper
                                key={unit.id}
                                {...unit}
                                mothershipId={mothership.id}
                                counts={countsByOrgIds.data?.[unit.id] ?? null}
                            />
                        )),
                    )}
                </StructTreeView>
            </PageWrapper>
        </LayoutMain>
    );
};
