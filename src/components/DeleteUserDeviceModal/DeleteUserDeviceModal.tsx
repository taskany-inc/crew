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

import { useDeviceMutations } from '../../modules/deviceHooks';
import { UserDeviceInfo } from '../../modules/deviceTypes';
import { UserDeviceListItem } from '../UserDeviceListItem';

import { tr } from './DeleteUserDeviceModal.i18n';

interface DeleteUserDeviceModalProps {
    visible: boolean;
    device: UserDeviceInfo;
    onClose: VoidFunction;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

export const DeleteUserDeviceModal = ({ visible, device, onClose }: DeleteUserDeviceModalProps) => {
    const { deleteUserDevice } = useDeviceMutations();

    const onDeleteClick = useCallback(async () => {
        await deleteUserDevice({ deviceId: device.deviceId, deviceName: device.deviceName });
        onClose();
    }, [deleteUserDevice, device.deviceId, device.deviceName, onClose]);

    return (
        <Modal view="danger" visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Delete device')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <StyledInfoWrapper>
                    <UserDeviceListItem userDevice={device} />
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
