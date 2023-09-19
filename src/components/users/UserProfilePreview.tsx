import { User } from 'prisma/prisma-client';
import { ModalContent } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL } from '@taskany/colors';

import { PreviewHeader } from '../PreviewHeader';
import { pages } from '../../hooks/useRouter';

import { UserContacts } from './UserContacts';
import { UserTeams } from './UserTeams';
import { QuickSummary } from './QuickSummary';
import { UserDevices } from './UserDevices';

const StyledModalContent = styled(ModalContent)`
    padding-top: ${gapL};
    overflow: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;

type UserProps = {
    user: User;
    groupName?: string;
    role?: string;
};

export const UserProfilePreview = ({ user, groupName, role }: UserProps): JSX.Element => {
    return (
        <>
            <PreviewHeader
                preTitle={role}
                user={user}
                subtitle={groupName}
                title={user.name}
                link={pages.user(user.id)}
            />
            <StyledModalContent>
                <QuickSummary />
                <UserTeams user={user} />
                <UserContacts user={user} userServices={[]} />
                <UserDevices />
            </StyledModalContent>
        </>
    );
};
