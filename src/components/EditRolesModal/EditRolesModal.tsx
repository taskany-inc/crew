import styled from 'styled-components';
import { Modal, ModalContent, ModalCross, ModalHeader, Tag, FormTitle } from '@taskany/bricks';
import { IconXOutline } from '@taskany/icons';
import { gapM, gapS } from '@taskany/colors';

import { MembershipInfo } from '../../modules/userTypes';
import { AddRoleToMembershipForm } from '../AddRoleToMembershipForm/AddRoleToMembershipForm';
import { UserListItem } from '../UserListItem/UserListItem';
import { useRoleMutations } from '../../modules/roleHooks';
import { GroupListItem } from '../GroupListItem';
import { EditPercentageForm } from '../EditPercentageForm/EditPercentageForm';

import { tr } from './EditRolesModal.i18n';

interface EditRolesModalProps {
    membership: MembershipInfo;
    visible: boolean;
    onClose: VoidFunction;
}

export const StyledModalContent = styled(ModalContent)`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
`;

const StyledTag = styled(Tag)`
    display: inline-flex;
    gap: ${gapS};
    align-items: center;
`;

export const EditRolesModal = ({ membership, visible, onClose }: EditRolesModalProps) => {
    const { removeFromMembership } = useRoleMutations();

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Edit')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <StyledModalContent>
                <GroupListItem groupId={membership.group.id} groupName={membership.group.name} />
                <UserListItem user={membership.user} />

                <div>
                    {membership.roles.map((role) => (
                        <StyledTag key={role.id}>
                            {role.name}
                            <IconXOutline
                                size="xxs"
                                onClick={() => {
                                    removeFromMembership({ membershipId: membership.id, roleId: role.id });
                                }}
                            />
                        </StyledTag>
                    ))}
                </div>

                <AddRoleToMembershipForm membershipId={membership.id} />
                <EditPercentageForm membership={membership} />
            </StyledModalContent>
        </Modal>
    );
};
