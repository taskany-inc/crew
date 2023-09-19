import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapS, gray9 } from '@taskany/colors';
import { Text } from '@taskany/bricks';

import { PageSep } from '../PageSep';
import { UserListItem } from '../UserListItem';

import { tr } from './users.i18n';

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const QuickSummary = () => {
    return (
        <div>
            <Text as="span" size="m" color={gray9} weight="bold">
                {tr('Quick summary')}
                <PageSep width={300} margins={5} />
            </Text>

            <StyledSupervisorText size="m" color={gray9}>
                {tr('Supervisor:')}{' '}
                <UserListItem user={{ name: 'Placeholder user', email: 'placeholder@example.com' } as User} />
            </StyledSupervisorText>
        </div>
    );
};
