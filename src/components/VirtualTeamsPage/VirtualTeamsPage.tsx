import { nullable } from '@taskany/bricks';
import React, { useMemo } from 'react';
import { FormControl, FormControlInput, Text, Button } from '@taskany/bricks/harmony';
import { IconFilterOutline, IconSearchOutline, IconSortDownOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { MothershipGroup } from '../../trpc/inferredTypes';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { NewGroupTreeViewNode } from '../GroupTreeViewNode/GroupTreeViewNode';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { PageWrapper } from '../PageWrapper/PageWrapper';

import s from './VirtualTeamsPage.module.css';
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
                </StructTreeView>
            </PageWrapper>
        </LayoutMain>
    );
};
