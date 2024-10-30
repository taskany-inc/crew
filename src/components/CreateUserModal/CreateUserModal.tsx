import { FormTitle, Modal, ModalContent, ModalCross, ModalHeader } from '@taskany/bricks';

import s from './CreateUserModal.module.css';
import { tr } from './CreateUserModal.i18n';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

export const CreateUserModal = ({ visible, onClose }: CreateUserModalProps) => {
    return (
        <Modal visible={visible} onClose={onClose} width={600} className={s.Modal}>
            <ModalHeader>
                <FormTitle>{tr('Create request for user creation')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent className={s.ModalContent}></ModalContent>
        </Modal>
    );
};
