import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { MembershipUserListItemEditable } from '../MembershipUserListItemEditable';

import { tr } from './groups.i18n';
import { AddUserToTeamForm } from './AddUserToTeamForm';

const StyledUserList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type TeamPeopleProps = {
    groupId: string;
};

export const TeamPeople = ({ groupId }: TeamPeopleProps) => {
    const membershipsQuery = trpc.group.getMemberships.useQuery(groupId);

    return (
        <NarrowSection title={tr('People')}>
            <StyledUserList>
                {membershipsQuery.data?.map((membership) => (
                    <MembershipUserListItemEditable key={membership.id} membership={membership} />
                ))}
            </StyledUserList>

            <AddUserToTeamForm groupId={groupId} />
        </NarrowSection>
    );
};
