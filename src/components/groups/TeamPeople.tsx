import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';
import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';

import { MembershipListItem } from './MembershipListItem';
import { tr } from './groups.i18n';

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
                    <MembershipListItem key={membership.id} membership={membership} />
                ))}
            </StyledUserList>

            {/* TODO: implement AddUserToGroup */}
            <InlineTrigger icon={<IconPlusCircleOutline noWrap size="s" />} text={'Add participant'} disabled />
        </NarrowSection>
    );
};
