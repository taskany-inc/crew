import { User } from 'prisma/prisma-client';
import { gapM, gapS, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';

import { PageSep } from '../PageSep';
import { MembershipListItem } from '../MembershipListItem';
import { trpc } from '../../trpc/trpcClient';

import { AddUserToTeamForm } from './AddUserToTeamForm';

const StyledMembershipList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type UserTeamsProps = {
    user: User;
};

export const UserTeams = ({ user }: UserTeamsProps) => {
    const membershipsQuery = trpc.user.getMemberships.useQuery(user.id);

    return (
        <div>
            <Text color={gray9} size="m" weight="bold">
                Teams
                <PageSep width={300} margins={5} />
            </Text>

            <StyledMembershipList>
                {membershipsQuery.data?.map((membership) => (
                    <MembershipListItem key={membership.id} membership={membership} />
                ))}
            </StyledMembershipList>

            <AddUserToTeamForm userId={user.id} />
        </div>
    );
};
