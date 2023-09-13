import { User } from 'prisma/prisma-client';
import { ModalContent } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL } from '@taskany/colors';

import { PreviewHeader } from '../PreviewHeader';

import { UserContacts } from './UserContacts';
import { UserTeams } from './UserTeams';
import { QuickSummary } from './QuickSummary';

const StyledModalContent = styled(ModalContent)`
    padding-top: ${gapL};
    overflow: scroll;
    height: 100%;
`;

type UserProps = {
    user: User;
    groupName?: string;
    role?: string;
};

export const UserProfilePreview = ({ user, groupName, role }: UserProps): JSX.Element => {
    return (
        <>
            <PreviewHeader preTitle={role} user={user} subtitle={groupName} title={user.name} />
            <StyledModalContent>
                <QuickSummary />
                <UserTeams user={user} />
                <UserContacts user={user} userServices={[]} />
            </StyledModalContent>
        </>
    );
};
