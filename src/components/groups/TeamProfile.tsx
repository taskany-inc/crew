import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { TabsMenu, TabsMenuItem, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL } from '@taskany/colors';

import { useGroup } from '../../api-client/groups/group-api-hook';
import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel';
import { Paths } from '../../utils/path';

const StyledTabsMenu = styled(TabsMenu)`
    margin-left: ${gapL};
`;

export const TeamProfile = () => {
    const router = useRouter();

    const { groupId } = router.query;
    const userQuery = useGroup(String(groupId));
    const group = userQuery.data;

    const parentId = group?.parentId;
    const parentQuery = useGroup(String(parentId));
    const parentGroup = parentQuery.data;

    if (!parentGroup) return null;
    if (!group) return null;

    const tabsMenuOptions: Array<[string, string]> = [
        ['People', Paths.PEOPLE],
        ['Services', Paths.SERVICES],
        ['Projects', Paths.PROJECTS],
        ['Goals', Paths.GOALS],
        ['Settings', Paths.SETTINGS],
    ];

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
            <Text>{group.name}</Text>
        </>
    );
};
