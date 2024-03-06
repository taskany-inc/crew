import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
} from '@taskany/bricks';
import { gapS } from '@taskany/colors';
import styled from 'styled-components';

import { MembershipInfo } from '../../modules/userTypes';
import { UserListItem } from '../UserListItem/UserListItem';
import { useUserMutations } from '../../modules/userHooks';
import { GroupListItem } from '../GroupListItem';

import { tr } from './RemoveUserFromGroupModal.i18n';

interface RemoveUserFromGroupModalProps {
    visible: boolean;
    membership: MembershipInfo;
    onClose: VoidFunction;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

export const RemoveUserFromGroupModal = ({ visible, membership, onClose }: RemoveUserFromGroupModalProps) => {
    const { removeUserFromGroup } = useUserMutations();

    const onRemoveClick = async () => {
        await removeUserFromGroup({ userId: membership.userId, groupId: membership.groupId });
        onClose();
    };

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Remove user from group')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <StyledInfoWrapper>
                    <UserListItem user={membership.user} />
                    <GroupListItem groupName={membership.group.name} groupId={membership.group.id} />
                </StyledInfoWrapper>
                <Form>
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onClose} />
                            <Button size="m" view="danger" onClick={onRemoveClick} text={tr('Remove')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
