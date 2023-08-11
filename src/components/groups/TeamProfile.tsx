import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { ModalPreview, TabsMenu, TabsMenuItem, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gapM, gray10 } from '@taskany/colors';
import { useState } from 'react';

import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel';
import { Paths } from '../../utils/path';
import { useUsersOfGroup } from '../../hooks/users-of-group-hooks';
import { UserProfileRreview } from '../users/UserProfilePreview';
import { User } from '../../api-client/users/user-types';
import { useGroup } from '../../hooks/group-hooks';

const StyledTabsMenu = styled(TabsMenu)`
    margin-left: ${gapL};
`;

export const TeamProfile = () => {
    const router = useRouter();
    const [userPreview, setUserPreview] = useState<User | undefined>(undefined);
    const [open, setOpen] = useState(false);
    const { groupId } = router.query;
    const userQuery = useGroup(String(groupId));
    const group = userQuery.data;

    const parentId = group?.parentId;
    const parentQuery = useGroup(String(parentId));
    const parentGroup = parentQuery.data;

    const usersOfGroupQuery = useUsersOfGroup(String(groupId));
    const users = usersOfGroupQuery.data;

    if (!users) return null;
    if (!parentGroup) return null;
    if (!group) return null;

    const tabsMenuOptions: Array<[string, string]> = [
        ['People', Paths.PEOPLE],
        ['Services', Paths.SERVICES],
        ['Projects', Paths.PROJECTS],
        ['Goals', Paths.GOALS],
        ['Settings', Paths.SETTINGS],
    ];

    const onClickUserPreview = (user: User) => {
        setUserPreview(user);
        setOpen(true);
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
                <Text>{group.name}</Text>
                {users &&
                    users.items.map((user) => (
                        <Text color={gray10} key={user._id} onClick={() => onClickUserPreview(user)}>
                            {user.fullName}
                        </Text>
                    ))}

                <ModalPreview visible={open} onClose={() => setOpen(false)}>
                    <UserProfileRreview user={userPreview} />
                </ModalPreview>
            </div>
        </>
    );
};
