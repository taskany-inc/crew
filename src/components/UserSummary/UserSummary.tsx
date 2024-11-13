import { nullable, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { User } from 'prisma/prisma-client';

import { UserCurators, UserSupervisor } from '../../modules/userTypes';
import { NarrowSection } from '../NarrowSection';
import { UserListItem } from '../UserListItem/UserListItem';

import { tr } from './UserSummary.i18n';

interface UserSummaryProps {
    user: User & UserSupervisor & UserCurators;
}

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const UserSummary = ({ user }: UserSummaryProps) => {
    return (
        <>
            <NarrowSection title={tr('Quick summary')}>
                {nullable(user.supervisor, (supervisor) => (
                    <StyledSupervisorText size="m" color={gray9}>
                        {tr('Supervisor')}
                        <UserListItem user={supervisor} />
                    </StyledSupervisorText>
                ))}
            </NarrowSection>
            {nullable(user.curators, (curators) => (
                <StyledSupervisorText size="m" color={gray9}>
                    {tr('Curators:')}
                    {curators.map((curator) => (
                        <UserListItem key={curator.id} user={curator} />
                    ))}
                </StyledSupervisorText>
            ))}
        </>
    );
};
