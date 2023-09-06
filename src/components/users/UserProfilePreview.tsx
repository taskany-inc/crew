import { ModalContent, ModalHeader } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gapM, gapSm } from '@taskany/colors';

import { User } from '../../api-client/users/user-types';
import { CommonHeaderPreview } from '../CommonHeaderPreview';

import { UserContacts } from './UserContacts';
import { UserTeams } from './UserTeams';
import { QuickSummary } from './QuickSummary';

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
    gap: ${gapM};
`;

const StyledCommonHeaderPreview = styled.div`
    margin-left: ${gapSm};
`;

const StyledModalContent = styled(ModalContent)`
    padding-top: ${gapL};
    overflow: scroll;
    height: 100%;
`;

type UserProps = {
    user: User;
};

export const UserProfileRreview = ({ user }: UserProps): JSX.Element => {
    const groupMemberships = user?.groupMemberships;

    const orgStructureGroup = groupMemberships?.filter(({ isOrgGroup }) => isOrgGroup)[0];
    const roles = orgStructureGroup?.roles.map((role) => role.title).join(', ');
    return (
        <>
            <StyledModalHeader>
                <StyledCommonHeaderPreview>
                    {' '}
                    <CommonHeaderPreview
                        preTitle={!!orgStructureGroup && roles}
                        avatar={user?.avatar || user?.email}
                        subtitle={orgStructureGroup?.groupName}
                        title={user?.fullName}
                    />
                </StyledCommonHeaderPreview>
            </StyledModalHeader>
            <StyledModalContent>
                <QuickSummary user={user} />
                <UserTeams user={user} />
                <UserContacts user={user} />
            </StyledModalContent>
        </>
    );
};
