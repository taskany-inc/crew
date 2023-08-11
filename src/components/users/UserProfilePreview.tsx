import { ModalContent, ModalHeader, UserPic, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapM, gapS, gapXl } from '@taskany/colors';

import { User } from '../../api-client/users/user-types';

import { UserContacts } from './UserContacts';
import { UserTeams } from './UserTeams';
import { QuickSummary } from './QuickSummary';

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledFullName = styled(Text)`
    align-self: end;
`;

const StyledCard = styled.div`
    display: grid;
    grid-template-columns: 6rem 1fr;

    gap: ${gapS};
    margin-left: ${gapM};
`;

const StyledModalContent = styled(ModalContent)`
    gap: ${gapXl};
`;

type UserProps = {
    user: User | undefined;
};

export const UserProfileRreview = ({ user }: UserProps): JSX.Element => {
    return (
        <>
            <StyledModalHeader>
                <StyledCard>
                    <UserPic size={90} src={user?.avatar} />
                    <StyledFullName as="span" size="xl">
                        {user?.fullName}
                    </StyledFullName>
                </StyledCard>
            </StyledModalHeader>
            <StyledModalContent>
                <QuickSummary user={user} />
                <UserTeams user={user} />
                <UserContacts user={user} />
            </StyledModalContent>
        </>
    );
};
