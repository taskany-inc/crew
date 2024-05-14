import { useCallback } from 'react';
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
import styled from 'styled-components';
import { gapS } from '@taskany/colors';

import { useGroupMutations } from '../../modules/groupHooks';
import { GroupAdminInfo } from '../../modules/groupTypes';
import { UserListItem } from '../UserListItem/UserListItem';

import { tr } from './RemoveUserFromGroupAdmins.i18n';

interface RemoveUserFromGroupAdminsProps {
    visible: boolean;
    admin: GroupAdminInfo;
    onClose: VoidFunction;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

export const RemoveUserFromGroupAdmins = ({ visible, onClose, admin }: RemoveUserFromGroupAdminsProps) => {
    const { removeUserToGroupAdmin } = useGroupMutations();

    const onDeleteClick = useCallback(async () => {
        await removeUserToGroupAdmin({
            userId: admin.userId,
            groupId: admin.groupId,
        });
        onClose();
    }, [removeUserToGroupAdmin, admin.userId, admin.groupId, onClose]);

    return (
        <Modal view="danger" visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Remove user from group administrators')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <StyledInfoWrapper>
                    <UserListItem user={admin.user} />
                </StyledInfoWrapper>
                <Form>
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onClose} />
                            <Button size="m" view="danger" onClick={onDeleteClick} text={tr('Delete')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
