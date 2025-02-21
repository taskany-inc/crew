import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup } from '../../trpc/inferredTypes';
import { sortByStringKey } from '../../utils/sortByStringKey';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { TeamTreeLayoutWrapper } from '../TeamTreeLayoutWrapper/TeamTreeLayoutWrapper';

import { tr } from './TeamsPage.i18n';

interface TeamsPage {
    mothership: MothershipGroup;
}

export const TeamsPage: React.FC<TeamsPage> = (props) => {
    const { mothership } = props;
    const currentGroup = trpc.group.getById.useQuery(mothership.id);
    const groupTree = trpc.group.getGroupTree.useQuery();

    const childrenData = useMemo(() => {
        if (groupTree.data == null) {
            return [];
        }
        return sortByStringKey(groupTree.data.children ?? [], ['group', 'name']);
    }, [groupTree.data]);

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

    const metaLoading = useMemo(
        () => metaDataByGroupIds.status === 'loading' || metaDataByGroupIds.fetchStatus !== 'idle',
        [metaDataByGroupIds],
    );

    if (group == null) {
        return null;
    }

    return (
        <TeamTreeLayoutWrapper title={tr('Structure')} pageTitle={group.name} header={<TeamPageHeader group={group} />}>
            <StructTreeView>
                {nullable(childrenData, (children) =>
                    children.map(({ group, children }) =>
                        nullable(group, (gr) => {
                            const groupMeta = metaDataByGroupIds.data?.[gr.id];
                            const counts = {
                                vacancies: groupMeta?.counts.vacancies ?? undefined,
                                memberships: groupMeta?.counts.memberships ?? undefined,
                            };

                            return (
                                <NewGroupTreeViewNode
                                    key={gr.id}
                                    name={gr.name}
                                    id={gr.id}
                                    supervisorId={gr.supervisorId}
                                    supervisor={groupMeta?.supervisor}
                                    counts={counts}
                                    childs={children}
                                    organizational
                                    loading={metaLoading}
                                    firstLevel
                                />
                            );
                        }),
                    ),
                )}
            </StructTreeView>
        </TeamTreeLayoutWrapper>
    );
};
