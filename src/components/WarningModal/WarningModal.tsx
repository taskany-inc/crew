import { Button, Modal, ModalContent, ModalHeader } from '@taskany/bricks/harmony';

import s from './WarningModal.module.css';
import { tr } from './WarningModal.i18n';

interface WarningModalProps {
    visible: boolean;
    warningText: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const WarningModal = ({ visible, warningText, onCancel, onConfirm }: WarningModalProps) => (
    <Modal visible={visible}>
        <ModalHeader view="warning">{tr('Confirm action')}</ModalHeader>
        <ModalContent>{warningText}</ModalContent>
        <div className={s.FormActions}>
            <Button type="button" text={tr('Cancel')} onClick={onCancel} />
            <Button type="button" text={tr('Yes, confirm')} view="warning" onClick={onConfirm} />
        </div>
    </Modal>
);
