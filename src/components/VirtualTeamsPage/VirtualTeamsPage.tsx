import React, { useMemo } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup } from '../../trpc/inferredTypes';
import { sortByStringKey } from '../../utils/sortByStringKey';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { TeamTreeLayoutWrapper } from '../TeamTreeLayoutWrapper/TeamTreeLayoutWrapper';
import {
    useGroupTreeFilter,
    filterGroupTree,
    groupTreeFilterValuesToRequestData,
} from '../../hooks/useGroupTreeFilter';

import { tr } from './VirtualTeamsPage.i18n';

interface VirtualTeamsPage {
    mothership: MothershipGroup;
}

export const VirtualTeamsPage: React.FC<VirtualTeamsPage> = (props) => {
    const { mothership } = props;
    const { values, isEmpty } = useGroupTreeFilter();

    const currentGroup = trpc.group.getById.useQuery(mothership.id);

    const groupTree = trpc.group.getVirtualGroupTree.useQuery();

    const filteredTree = useMemo(
        () =>
            currentGroup.data
                ? filterGroupTree(
                      {
                          id: currentGroup.data.id,
                          group: currentGroup.data,
                          children: groupTree.data?.children,
                      },
                      groupTreeFilterValuesToRequestData(values),
                  )
                : null,
        [currentGroup.data, groupTree.data, values],
    );

    const childrenData = useMemo(() => {
        if (!filteredTree) {
            return [];
        }
        return sortByStringKey(filteredTree.children ?? [], ['group', 'name']);
    }, [filteredTree]);

    const metaDataByGroupIds = trpc.group.getGroupMetaByIds.useQuery(
        {
            ids: (childrenData || []).map(({ id }) => id),
            organizational: false,
        },
        {
            enabled: (childrenData?.length ?? 0) > 0,
        },
    );

    const group = currentGroup.data ?? null;

    if (group == null) {
        return null;
    }

    return (
        <TeamTreeLayoutWrapper title={tr('Structure')} pageTitle={group.name} header={<TeamPageHeader group={group} />}>
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
                        businessUnit={item.group.businessUnit}
                    />
                );
            })}
        </TeamTreeLayoutWrapper>
    );
};
