import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { MembershipUserListItemEditable } from '../MembershipUserListItemEditable';
import { AddUserToTeamForm } from '../AddUserToTeamForm/AddUserToTeamForm';
import { Restricted } from '../Restricted';

import { tr } from './TeamPeople.i18n';

const StyledUserList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

interface TeamPeopleProps {
    groupId: string;
    isEditable: boolean;
}

export const TeamPeople = ({ groupId, isEditable }: TeamPeopleProps) => {
    const membershipsQuery = trpc.group.getMemberships.useQuery(groupId);

    return (
        <NarrowSection title={tr('People')}>
            <StyledUserList>
                {membershipsQuery.data?.map((membership) => (
                    <MembershipUserListItemEditable key={membership.id} membership={membership} />
                ))}
            </StyledUserList>

            <Restricted visible={isEditable}>
                <AddUserToTeamForm groupId={groupId} />
            </Restricted>
        </NarrowSection>
    );
};
