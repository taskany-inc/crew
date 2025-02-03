import { nullable, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { User } from 'prisma/prisma-client';

import { UserCurators, UserLocation, UserSupervisor } from '../../modules/userTypes';
import { NarrowSection } from '../NarrowSection';
import { UserListItem } from '../UserListItem/UserListItem';

import { tr } from './UserSummary.i18n';

interface UserSummaryProps {
    user: User & UserSupervisor & UserCurators & UserLocation;
}

const StyledText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const UserSummary = ({ user }: UserSummaryProps) => {
    return (
        <>
            <NarrowSection title={tr('Quick summary')}>
                {nullable(user.location, (location) => (
                    <Text size="m" color={gray9}>
                        {tr('Location')}: <Text as="span">{location.name}</Text>
                    </Text>
                ))}
                {nullable(user.supervisor, (supervisor) => (
                    <StyledText size="m" color={gray9}>
                        {tr('Supervisor')}
                        <UserListItem user={supervisor} />
                    </StyledText>
                ))}
            </NarrowSection>
            {nullable(user.curators, (curators) => (
                <StyledText size="m" color={gray9}>
                    {tr('Curators:')}
                    {curators.map((curator) => (
                        <UserListItem key={curator.id} user={curator} />
                    ))}
                </StyledText>
            ))}
        </>
    );
};
