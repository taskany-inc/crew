import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { InlineForm } from '@taskany/bricks';
import { IconAddOutline, IconArrowDownOutline, IconArrowUpOutline, IconBinOutline } from '@taskany/icons';
import { gapL, gapS } from '@taskany/colors';

import { LayoutMain } from '../layout/LayoutMain';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './groups.i18n';
import { GroupListItem } from './GroupListItem';

const StyledGroupItemWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    margin-bottom: ${gapS};
`;

const StyledChildrenWrapper = styled.div`
    margin-left: ${gapL};
`;

const GroupWithChildren = ({ group }: { group: Group }) => {
    const utils = trpc.useContext();
    const [showChildren, setShowChildren] = useState(false);
    const children = trpc.group.getChildren.useQuery(group.id, { enabled: showChildren });
    const add = trpc.group.add.useMutation();
    const delete_ = trpc.group.delete.useMutation();
    const [name, setName] = useState('');

    return (
        <div>
            {/* //TODO: replace with CollapsibleItem https://github.com/taskany-inc/bricks/issues/312 and https://github.com/taskany-inc/crew/issues/21*/}
            <StyledGroupItemWrapper>
                <GroupListItem group={group} />
                <IconBinOutline
                    size="xs"
                    onClick={() => {
                        delete_.mutateAsync(group.id).then(() => {
                            utils.group.invalidate();
                        });
                    }}
                />
                {showChildren ? (
                    <IconArrowUpOutline size="xs" onClick={() => setShowChildren(false)} />
                ) : (
                    <IconArrowDownOutline size="xs" onClick={() => setShowChildren(true)} />
                )}
                <InlineForm
                    onSubmit={() => {
                        return add.mutateAsync({ name, parentId: group.id }).then(() => {
                            setName('');
                            utils.group.getChildren.invalidate();
                        });
                    }}
                    onReset={() => {
                        setName('');
                    }}
                    renderTrigger={(props) => <IconAddOutline size="s" {...props} />}
                >
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                    <button type="submit">add child</button>
                </InlineForm>
            </StyledGroupItemWrapper>
            {showChildren && children.data && (
                <StyledChildrenWrapper>
                    {children.data.map((c) => (
                        <GroupWithChildren key={c.id} group={c} />
                    ))}
                </StyledChildrenWrapper>
            )}
        </div>
    );
};

export const TeamsPage = () => {
    const roots = trpc.group.getRoots.useQuery();
    const add = trpc.group.add.useMutation();
    const utils = trpc.useContext();
    const [name, setName] = useState('');

    return (
        <LayoutMain pageTitle={tr('Teams')}>
            <div style={{ marginBottom: 24 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} />
                <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                        add.mutateAsync({ name }).then(() => {
                            utils.group.getRoots.invalidate();
                            setName('');
                        });
                    }}
                >
                    add root
                </button>
            </div>
            {(roots.data ?? []).map((g) => (
                <GroupWithChildren key={g.id} group={g} />
            ))}
        </LayoutMain>
    );
};
