import styled from 'styled-components';
import { Modal, ModalContent, ModalCross, ModalHeader, Text, Tag, FormTitle } from '@taskany/bricks';
import { gapM } from '@taskany/colors';

import { UserMembership } from '../../modules/user.types';
import { AddRoleToMembershipForm } from '../users/AddRoleToMembershipForm';
import { UserListItem } from '../UserListItem';
import { useRoleMutations } from '../../modules/role.hooks';

import { GroupListItem } from './GroupListItem';
import { tr } from './groups.i18n';

type EditRolesModalProps = {
    membership: UserMembership;
    visible: boolean;
    onClose: VoidFunction;
};

export const StyledModalContent = styled(ModalContent)`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
`;

export const EditRolesModal = ({ membership, visible, onClose }: EditRolesModalProps) => {
    const { removeFromMembership } = useRoleMutations();

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Edit roles')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <StyledModalContent>
                <GroupListItem group={membership.group} />
                <UserListItem user={membership.user} />

                <div>
                    {membership.roles.map((role) => (
                        <Tag
                            key={role.id}
                            onClick={() => {
                                removeFromMembership.mutate({ membershipId: membership.id, roleId: role.id });
                            }}
                        >
                            {role.name}
                        </Tag>
                    ))}
                </div>

                <AddRoleToMembershipForm membershipId={membership.id} />
            </StyledModalContent>
        </Modal>
    );
};
