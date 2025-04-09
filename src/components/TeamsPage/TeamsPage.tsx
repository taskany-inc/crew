import React, { useMemo } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup } from '../../trpc/inferredTypes';
import { sortByStringKey } from '../../utils/sortByStringKey';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { TeamTreeLayoutWrapper } from '../TeamTreeLayoutWrapper/TeamTreeLayoutWrapper';
import {
    useGroupTreeFilter,
    filterGroupTree,
    groupTreeFilterValuesToRequestData,
} from '../../hooks/useGroupTreeFilter';

import { tr } from './TeamsPage.i18n';

interface TeamsPage {
    mothership: MothershipGroup;
}

export const TeamsPage: React.FC<TeamsPage> = (props) => {
    const { mothership } = props;
    const currentGroup = trpc.group.getById.useQuery(mothership.id);

    const groupTree = trpc.group.getGroupTree.useQuery();

    const { values, isEmpty } = useGroupTreeFilter();

    const filteredTree = useMemo(
        () => filterGroupTree(groupTree.data, groupTreeFilterValuesToRequestData(values)),
        [groupTree.data, values],
    );

    const childrenData = useMemo(() => {
        if (filteredTree == null) {
            return [];
        }
        return sortByStringKey(filteredTree.children ?? [], ['group', 'name']);
    }, [filteredTree]);

    const metaDataByGroupIds = trpc.group.getGroupMetaByIds.useQuery(
        {
            ids: (childrenData || []).map(({ id }) => id),
            organizational: true,
        },
        {
            enabled: (childrenData?.length ?? 0) > 0,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
        },
    );

    const group = currentGroup.data ?? null;

    if (group == null) {
        return null;
    }

    return (
        <TeamTreeLayoutWrapper title={tr('Structure')} pageTitle={group.name} header={<TeamPageHeader group={group} />}>
            <StructTreeView>
                {childrenData.map((item) => {
                    const groupMeta = metaDataByGroupIds.data?.[item.id];
                    const counts = {
                        vacancies: groupMeta?.counts.vacancies ?? undefined,
                        memberships: groupMeta?.counts.memberships ?? undefined,
                    };

                    return (
                        <NewGroupTreeViewNode
                            key={item.id}
                            id={item.id}
                            name={item.group.name}
                            supervisorId={item.group.supervisorId}
                            supervisor={groupMeta?.supervisor}
                            counts={counts}
                            childs={item.children}
                            firstLevel
                            isOpen={!isEmpty}
                            organizational
                            businessUnit={item.group.businessUnit}
                        />
                    );
                })}
            </StructTreeView>
        </TeamTreeLayoutWrapper>
    );
};
