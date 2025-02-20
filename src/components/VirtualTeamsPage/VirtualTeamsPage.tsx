import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup } from '../../trpc/inferredTypes';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { TeamTreeLayoutWrapper } from '../TeamTreeLayoutWrapper/TeamTreeLayoutWrapper';

import { tr } from './VirtualTeamsPage.i18n';

interface VirtualTeamsPage {
    mothership: MothershipGroup;
}

export const VirtualTeamsPage: React.FC<VirtualTeamsPage> = (props) => {
    const { mothership } = props;
    const currentGroup = trpc.group.getById.useQuery(mothership.id);
    const groupTree = trpc.group.getVirtualGroupTree.useQuery();

    const childrenData = useMemo(() => {
        if (groupTree.data == null) {
            return [];
        }
        return groupTree.data?.children;
    }, [groupTree.data]);

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
                                firstLevel
                            />
                        );
                    }),
                ),
            )}
        </TeamTreeLayoutWrapper>
    );
};
