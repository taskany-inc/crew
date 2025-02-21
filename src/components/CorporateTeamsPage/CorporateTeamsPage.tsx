import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup, OrganizationUnit } from '../../trpc/inferredTypes';
import { sortByStringKey } from '../../utils/sortByStringKey';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { TeamTreeLayoutWrapper } from '../TeamTreeLayoutWrapper/TeamTreeLayoutWrapper';

import { tr } from './CorporateTeamsPage.i18n';

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
            organizational
            hideDescription
        />
    );
};

export const CorporateTeamsPage: React.FC<CorporateTeamsPage> = ({ mothership }) => {
    const currentGroup = trpc.group.getById.useQuery(mothership.id);
    const organizationUnits = trpc.organizationUnit.getAll.useQuery();
    const countsByOrgIds = trpc.organizationUnit.getCountsByOrgUnitIds.useQuery(
        (organizationUnits.data || []).map(({ id }) => id),
        { enabled: (organizationUnits.data?.length ?? 0) > 0 },
    );

    const group = currentGroup.data ?? null;

    const sortedOrganizationUnits = useMemo(
        () => sortByStringKey(organizationUnits.data ?? [], ['name']),
        [organizationUnits],
    );

    if (group == null) {
        return null;
    }

    return (
        <TeamTreeLayoutWrapper title={tr('Structure')} pageTitle={group.name} header={<TeamPageHeader group={group} />}>
            {nullable(sortedOrganizationUnits, (units) =>
                units.map((unit) => (
                    <CorporateTreeNodeWrapper
                        key={unit.id}
                        {...unit}
                        mothershipId={mothership.id}
                        counts={countsByOrgIds.data?.[unit.id] ?? null}
                    />
                )),
            )}
        </TeamTreeLayoutWrapper>
    );
};
