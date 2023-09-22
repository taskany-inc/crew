import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { IconBinOutline, IconMoreHorizontalOutline } from '@taskany/icons';
import { ModalPreview } from '@taskany/bricks';

import { LayoutMain } from '../layout/LayoutMain';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './groups.i18n';
import { TeamProfilePreview } from './TeamProfilePreview';

const GroupWithChildren = ({ group }: { group: Group }) => {
    const utils = trpc.useContext();
    const [showChildren, setShowChildren] = useState(false);
    const children = trpc.group.getChildren.useQuery(group.id, { enabled: showChildren });
    const breadcrumbs = trpc.group.getBreadcrumbs.useQuery(group.id);
    const add = trpc.group.add.useMutation();
    const delete_ = trpc.group.delete.useMutation();
    const [name, setName] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    if (!breadcrumbs.data) return <span>Loading...</span>;
    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <Link onClick={() => setShowPreview(true)}>{group.name} </Link>
                <IconMoreHorizontalOutline size="xs" title={breadcrumbs.data.map((b) => b.name).join()} />
                <IconBinOutline
                    style={{ marginLeft: 8 }}
                    size="xs"
                    onClick={() => {
                        delete_.mutateAsync(group.id).then(() => {
                            utils.group.invalidate();
                        });
                    }}
                />
                <input style={{ marginLeft: 8 }} value={name} onChange={(e) => setName(e.target.value)} />
                <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                        add.mutateAsync({ name, parentId: group.id }).then(() => {
                            setName('');
                            utils.group.getChildren.invalidate();
                        });
                    }}
                >
                    add child
                </button>
            </div>
            {!showChildren && <button onClick={() => setShowChildren(true)}>show children</button>}
            {showChildren && children.data && (
                <div style={{ marginLeft: 24 }}>
                    {children.data.map((c) => (
                        <GroupWithChildren key={c.id} group={c} />
                    ))}
                </div>
            )}

            <ModalPreview visible={showPreview} onClose={() => setShowPreview(false)}>
                <TeamProfilePreview group={group} />
            </ModalPreview>
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
