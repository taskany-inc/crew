import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { ModalPreview, TabsMenu, TabsMenuItem, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gray10 } from '@taskany/colors';
import { useState } from 'react';

import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel';
import { pages } from '../../utils/pages';
import { useUsersOfGroup } from '../../hooks/users-of-group-hooks';
import { UserProfileRreview } from '../users/UserProfilePreview';
import { User } from '../../api-client/users/user-types';
import { useGroup } from '../../hooks/group-hooks';
import { Group } from '../../api-client/groups/group-types';
import { useGroupChildren } from '../../hooks/children-hooks';

import { TeamProfilePreview } from './TeamProfilePreview';

const StyledTabsMenu = styled(TabsMenu)`
    margin-left: ${gapL};
`;

const StyledModalPreview = styled(ModalPreview)`
    overflow: visible;
    height: 100%;
`;

export const TeamProfile = () => {
    const router = useRouter();
    const [userPreview, setUserPreview] = useState<User | undefined>(undefined);
    const [groupPreview, setGroupPreview] = useState<Group | undefined>(undefined);

    const { teamId } = router.query;
    const userQuery = useGroup(String(teamId));
    const group = userQuery.data;

    const parentId = group?.parentId;
    const parentQuery = useGroup(String(parentId));
    const parentGroup = parentQuery.data;

    const usersOfGroupQuery = useUsersOfGroup(String(teamId));
    const users = usersOfGroupQuery.data;

    const groupChildrenQuery = useGroupChildren(String(teamId));
    const groupChildren = groupChildrenQuery.data;

    if (!users) return null;
    if (!parentGroup) return null;
    if (!group) return null;
    if (!groupChildren) return null;

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
        <>
            <CommonHeader
                subtitle={parentGroup.name}
                title={group.name}
                description={'This is  group description. One line and truncate...'}
            />

            <StyledTabsMenu>
                {tabsMenuOptions.map(([title, href]) => (
                    <NextLink key={href} href={href} passHref>
                        <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                    </NextLink>
                ))}
            </StyledTabsMenu>
            <FiltersPanel />

            <div style={{ marginLeft: gapL }}>
                <Text onClick={() => onClickGroupPreview(group)}>{group.name}</Text>
                {users &&
                    users.items.map((user) => (
                        <Text color={gray10} key={user._id} onClick={() => onClickUserPreview(user)}>
                            {user.fullName}
                        </Text>
                    ))}

                <StyledModalPreview visible={!!userPreview} onClose={() => onClickUserPreview(undefined)}>
                    <UserProfileRreview user={userPreview} />
                </StyledModalPreview>

                <StyledModalPreview visible={!!groupPreview} onClose={() => onClickGroupPreview(undefined)}>
                    <TeamProfilePreview group={groupPreview} users={users} groupChildren={groupChildren} />
                </StyledModalPreview>
            </div>
        </>
    );
};
