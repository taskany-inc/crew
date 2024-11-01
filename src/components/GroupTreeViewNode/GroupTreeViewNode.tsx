import { Group, User } from 'prisma/prisma-client';
import { nullable, TreeViewNode } from '@taskany/bricks';
import { User as HarmonyUser, Text } from '@taskany/bricks/harmony';

import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';

import s from './GroupTreeViewNode.module.css';

const GroupRow = ({ group }: { group: Group & { supervisor: User | null } }) => {
    const { showGroupPreview } = usePreviewContext();
    return (
        <Link className={s.Link} onClick={() => showGroupPreview(group.id)} href={pages.team(group.id)}>
            <div className={s.GroupRow}>
                <Text className={s.GroupName} size="l">
                    {group.name}
                </Text>
                <HarmonyUser className={s.User} email={group.supervisor?.email} name={group.supervisor?.name} />
            </div>
        </Link>
    );
};

interface GroupTreeViewNodeProps {
    group: Group & { supervisor: User | null };
}

export const GroupTreeViewNode = ({ group }: GroupTreeViewNodeProps) => {
    const childrenQuery = trpc.group.getChildren.useQuery(group.id);
    const childrenData = childrenQuery.data ?? [];

    return (
        <div className={s.TreeViewNodeContainer}>
            {nullable(
                childrenData,
                (children) => (
                    <TreeViewNode title={<GroupRow group={group} />}>
                        {children.map((child) => (
                            <GroupTreeViewNode key={child.id} group={child} />
                        ))}
                    </TreeViewNode>
                ),
                <div className={s.NoChildrenGroup}>
                    <GroupRow group={group} />
                </div>,
            )}
        </div>
    );
};
