import { Button, Modal, ModalContent, ModalHeader, Input, ModalCross } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import s from './WarningModal.module.css';
import { tr } from './WarningModal.i18n';

interface WarningModalProps {
    visible: boolean;
    warningText: string;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
    onInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    inputPlaceholder?: string;
    view?: React.ComponentProps<typeof ModalHeader>['view'];
}
export const WarningModal = ({
    visible,
    warningText,
    onCancel,
    onConfirm,
    view,
    onInputChange,
    inputPlaceholder,
}: WarningModalProps) => (
    <Modal visible={visible} width={530}>
        <ModalHeader view={view}>
            {tr('Confirm action')}
            <ModalCross onClick={onCancel} />
        </ModalHeader>
        <ModalContent className={s.ModalContent}>
            {warningText}
            {nullable(onInputChange, (onChange) => (
                <Input className={s.Input} outline onChange={onChange} placeholder={inputPlaceholder} />
            ))}
        </ModalContent>
        <div className={s.FormActions}>
            <Button type="button" text={tr('Cancel')} onClick={onCancel} />
            <Button
                className={s.ConfirmButton}
                type="button"
                text={tr('Yes, confirm')}
                view={view}
                onClick={onConfirm}
            />
        </div>
    </Modal>
);
