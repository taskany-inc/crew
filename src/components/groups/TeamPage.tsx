import { useRouter } from 'next/router';
import { TabsMenu, TabsMenuItem, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gray10 } from '@taskany/colors';

import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';
import { usePreviewContext } from '../../context/preview-context';

const StyledTabsMenu = styled(TabsMenu)`
    margin-left: ${gapL};
`;

export const TeamPage = () => {
    const router = useRouter();
    const { showUserPreview, showGroupPreview } = usePreviewContext();

    const { teamId } = router.query;
    const groupQuery = trpc.group.getById.useQuery(String(teamId));
    const group = groupQuery.data;

    const parentId = group?.parentId;
    const parentQuery = trpc.group.getById.useQuery(String(parentId), { enabled: !!parentId });
    const parentGroup = parentQuery.data;

    const groupMembersQuery = trpc.user.getGroupMembers.useQuery(String(teamId));
    const users = groupMembersQuery.data;

    if (!group) return null;

    const tabsMenuOptions: Array<[string, string]> = [
        ['People', pages.people],
        ['Services', pages.services],
        ['Projects', pages.projects],
        ['Goals', pages.goals],
        ['Settings', pages.settings],
    ];

    return (
        <LayoutMain pageTitle={group.name}>
            <CommonHeader
                subtitle={parentGroup?.name}
                title={group.name}
                description={'This is  group description. One line and truncate...'}
            />

            <StyledTabsMenu>
                {tabsMenuOptions.map(([title, href]) => (
                    <Link key={href} href={href}>
                        <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                    </Link>
                ))}
            </StyledTabsMenu>
            <FiltersPanel />

            <div style={{ marginLeft: gapL }}>
                <Text onClick={() => showGroupPreview(group.id)}>{group.name}</Text>
                {users &&
                    users.map((user) => (
                        <Text color={gray10} key={user.id} onClick={() => showUserPreview(user.id)}>
                            {user.name}
                        </Text>
                    ))}
            </div>
        </LayoutMain>
    );
};
