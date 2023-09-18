import { Group, User } from 'prisma/prisma-client';
import { useRouter } from 'next/router';
import { ModalPreview, TabsMenu, TabsMenuItem, Text, nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gray10 } from '@taskany/colors';
import { useState } from 'react';

import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel';
import { pages } from '../../hooks/useRouter';
import { UserProfilePreview } from '../users/UserProfilePreview';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';

import { TeamProfilePreview } from './TeamProfilePreview';

const StyledTabsMenu = styled(TabsMenu)`
    margin-left: ${gapL};
`;

const StyledModalPreview = styled(ModalPreview)`
    overflow: visible;
    height: 100%;
`;

export const TeamPage = () => {
    const router = useRouter();
    const [userPreview, setUserPreview] = useState<User | undefined>(undefined);
    const [groupPreview, setGroupPreview] = useState<Group | undefined>(undefined);

    const { teamId } = router.query;
    const groupQuery = trpc.group.getById.useQuery(String(teamId));
    const group = groupQuery.data;

    const parentId = group?.parentId;
    const parentQuery = trpc.group.getById.useQuery(String(parentId), { enabled: !!parentId });
    const parentGroup = parentQuery.data;

    const groupMembersQuery = trpc.user.getGroupMembers.useQuery(String(teamId));
    const users = groupMembersQuery.data;

    const groupChildrenQuery = trpc.group.getChildren.useQuery(String(teamId));
    const groupChildren = groupChildrenQuery.data;

    if (!group) return null;

    const tabsMenuOptions: Array<[string, string]> = [
        ['People', pages.people],
        ['Services', pages.services],
        ['Projects', pages.projects],
        ['Goals', pages.goals],
        ['Settings', pages.settings],
    ];

    const onClickUserPreview = (user: User | undefined) => {
        setUserPreview(user);
        setGroupPreview(undefined);
    };

    const onClickGroupPreview = (groupData: Group | undefined) => {
        setGroupPreview(groupData);
        setUserPreview(undefined);
    };

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
                <Text onClick={() => onClickGroupPreview(group)}>{group.name}</Text>
                {users &&
                    users.map((user) => (
                        <Text color={gray10} key={user.id} onClick={() => onClickUserPreview(user)}>
                            {user.name}
                        </Text>
                    ))}

                <StyledModalPreview visible={!!userPreview} onClose={() => onClickUserPreview(undefined)}>
                    {nullable(userPreview, (user) => (
                        <UserProfilePreview user={user} />
                    ))}
                </StyledModalPreview>

                <StyledModalPreview visible={!!groupPreview} onClose={() => onClickGroupPreview(undefined)}>
                    {nullable(groupPreview, (groupData) => (
                        <TeamProfilePreview group={groupData} users={users ?? []} groupChildren={groupChildren ?? []} />
                    ))}
                </StyledModalPreview>
            </div>
        </LayoutMain>
    );
};
