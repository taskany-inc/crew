import styled from 'styled-components';
import { Modal, ModalContent, ModalCross, ModalHeader, Text, Tag } from '@taskany/bricks';
import { gapM } from '@taskany/colors';

import { UserMembership } from '../../modules/user.types';
import { AddRoleToMembershipForm } from '../users/AddRoleToMembershipForm';
import { UserListItem } from '../UserListItem';
import { GroupListItem } from '../GroupListItem';
import { useRoleMutations } from '../../modules/role.hooks';

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
                <Text size="l">{tr('Edit roles')}</Text>
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
