import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { gapL, gapS } from '@taskany/colors';

import { TeamPageFiltersPanel } from '../TeamPageFiltersPanel';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';
import { UserListItem } from '../UserListItem';

import { GroupListItem } from './GroupListItem';
import { TeamPageHeader } from './TeamPageHeader';

const StyledGroupList = styled.div`
    margin: 0 ${gapL};
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

type TeamPageProps = {
    teamId: string;
};

export const TeamPage = ({ teamId }: TeamPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    const group = groupQuery.data;

    const groupMembersQuery = trpc.user.getGroupMembers.useQuery(String(teamId));
    const users = groupMembersQuery.data;

    const childrenQuery = trpc.group.getChildren.useQuery(teamId);
    const children = childrenQuery.data ?? [];

    if (!group) return null;

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageHeader group={group} />

            <TeamPageFiltersPanel />

            {/* TODO: replace with CollapsibleItem https://github.com/taskany-inc/bricks/issues/312 */}
            <StyledGroupList>
                {nullable(users, (u) => (
                    <>
                        <Text>Users:</Text>
                        {u.map((user) => (
                            <UserListItem key={user.id} user={user} />
                        ))}
                    </>
                ))}

                {nullable(children, (c) => (
                    <>
                        <Text>Children:</Text>
                        {c.map((child) => (
                            <GroupListItem key={child.id} group={child} />
                        ))}
                    </>
                ))}
            </StyledGroupList>
        </LayoutMain>
    );
};
