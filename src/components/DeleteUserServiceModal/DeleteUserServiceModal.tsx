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

import { useServiceMutations } from '../../modules/serviceHooks';
import { UserServiceListItem } from '../UserServiceListItem';
import { UserServiceInfo } from '../../modules/serviceTypes';

import { tr } from './DeleteUserServiceModal.i18n';

interface DeleteUserServiceModalProps {
    visible: boolean;
    userService: UserServiceInfo;
    onClose: VoidFunction;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

export const DeleteUserServiceModal = ({ visible, userService, onClose }: DeleteUserServiceModalProps) => {
    const { deleteUserService } = useServiceMutations();

    const onDeleteClick = useCallback(async () => {
        await deleteUserService({
            userId: userService.userId,
            serviceId: userService.serviceId,
            serviceName: userService.serviceName,
        });
        onClose();
    }, [deleteUserService, userService.userId, userService.serviceId, userService.serviceName, onClose]);

    return (
        <Modal view="danger" visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Delete Service')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <StyledInfoWrapper>
                    <UserServiceListItem userService={userService} />
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
