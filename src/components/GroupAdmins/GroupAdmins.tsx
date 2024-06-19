import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';
import { Fieldset } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { Restricted } from '../Restricted';
import { AddUserToGroupAdminsForm } from '../AddUserToGroupAdminsForm/AddUserToGroupAdminsForm';
import { UserListItem } from '../UserListItem/UserListItem';
import { GroupAdminMenu } from '../GroupAdminMenu/GroupAdminMenu';

import { tr } from './GroupAdmins.i18n';

const StyledUserList = styled.div`
    margin: 0 ${gapS} ${gapS} ${gapM};
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    flex-wrap: wrap;
    min-height: 28px;
`;
const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px 28px;
    width: 300px;
`;

interface GroupAdminsProps {
    groupId: string;
    isEditable: boolean;
}

export const GroupAdmins = ({ groupId, isEditable }: GroupAdminsProps) => {
    const groupAdminsQuery = trpc.group.getGroupAdmins.useQuery(groupId);

    return (
        <>
            <Fieldset title={tr('Administrators:')}>
                <StyledUserList>
                    {groupAdminsQuery.data?.map((groupAdmin) => (
                        <StyledRow key={groupAdmin.userId}>
                            <UserListItem user={groupAdmin.user} />
                            <Restricted visible={isEditable}>
                                <GroupAdminMenu admin={groupAdmin} />
                            </Restricted>
                        </StyledRow>
                    ))}
                    <Restricted visible={isEditable}>
                        <AddUserToGroupAdminsForm groupId={groupId} />
                    </Restricted>
                </StyledUserList>
            </Fieldset>
        </>
    );
};
