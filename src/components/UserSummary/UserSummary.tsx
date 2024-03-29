import { nullable, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { User } from 'prisma/prisma-client';

import { UserSupervisor } from '../../modules/userTypes';
import { NarrowSection } from '../NarrowSection';
import { UserListItem } from '../UserListItem/UserListItem';

import { tr } from './UserSummary.i18n';

interface UserSummaryProps {
    user: User & UserSupervisor;
}

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const UserSummary = ({ user }: UserSummaryProps) => {
    return (
        <>
            {nullable(user.supervisor, (supervisor) => (
                <NarrowSection title={tr('Quick summary')}>
                    <StyledSupervisorText size="m" color={gray9}>
                        {tr('Supervisor')}
                        <UserListItem user={supervisor} />
                    </StyledSupervisorText>
                </NarrowSection>
            ))}
        </>
    );
};
