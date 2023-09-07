import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { IconBinOutline, IconMoreHorizontalOutline } from '@taskany/icons';

import { LayoutMain } from '../components/layout/LayoutMain';
import { trpc } from '../trpc/trpcClient';

import { tr } from './controllers.i18n';

const GroupWithChildren = ({ group }: { group: Group }) => {
    const utils = trpc.useContext();
    const children = trpc.groupNew.getChildren.useQuery(group.id);
    const breadcrumbs = trpc.groupNew.getBreadcrumbs.useQuery(group.id);
    const add = trpc.groupNew.add.useMutation();
    const delete_ = trpc.groupNew.delete.useMutation();
    const [name, setName] = useState('');
    if (!children.data || !breadcrumbs.data) return <span>Loading...</span>;
    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <span>{group.name} </span>
                <IconMoreHorizontalOutline size="xs" title={breadcrumbs.data.map((b) => b.name).join()} />
                <IconBinOutline
                    style={{ marginLeft: 8 }}
                    size="xs"
                    onClick={() => {
                        delete_.mutateAsync(group.id).then(() => {
                            utils.groupNew.invalidate();
                        });
                    }}
                />
                <input style={{ marginLeft: 8 }} value={name} onChange={(e) => setName(e.target.value)} />
                <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                        add.mutateAsync({ name, parentId: group.id }).then(() => {
                            setName('');
                            utils.groupNew.getChildren.invalidate();
                        });
                    }}
                >
                    add child
                </button>
            </div>
            <div style={{ marginLeft: 24 }}>
                {children.data.map((c) => (
                    <GroupWithChildren key={c.id} group={c} />
                ))}
            </div>
        </div>
    );
};

export const TeamsPage = () => {
    const roots = trpc.groupNew.getRoots.useQuery();
    const add = trpc.groupNew.add.useMutation();
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
                            utils.groupNew.getRoots.invalidate();
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
