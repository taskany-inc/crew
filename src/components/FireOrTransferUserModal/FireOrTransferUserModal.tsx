import { useState } from 'react';
import { nullable } from '@taskany/bricks';
import { ModalHeader, Modal, ModalContent, Text, Button } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { IconTickCircleOutline } from '@taskany/icons';

import s from './FireOrTransferUserModal.module.css';
import { tr } from './FireOrTransferUserModal.i18n';

interface FireOrTransferUserModalProps {
    visible: boolean;
    onDismiss: () => void;
    onTransfer: () => void;
    onClose: VoidFunction;
}

interface RequestTypeListType {
    name: string;
    description: string;
    type: 'transfer' | 'dismiss';
}

export const FireOrTransferUserModal = ({ visible, onClose, onDismiss, onTransfer }: FireOrTransferUserModalProps) => {
    const [active, setActive] = useState<RequestTypeListType['type'] | undefined>();

    const requestTypeList: RequestTypeListType[] = [
        {
            name: tr('Create a planned dismiss'),
            description: tr('Informing about the dismiss of an employee'),
            type: 'dismiss',
        },
        {
            name: tr('Transfer employee'),
            description: tr('Informing about the transfer of an employee'),
            type: 'transfer',
        },
    ];

    return (
        <Modal visible={visible} onClose={onClose} width={530}>
            <ModalHeader>
                <Text weight="bold">{tr('Which request you want to create?')}</Text>
            </ModalHeader>

            <ModalContent>
                {requestTypeList.map(({ name, description, type }) => (
                    <div className={s.RequestType} key={type}>
                        <div>
                            <Text
                                className={cn(s.Text, {
                                    [s.Text_active]: active === type,
                                })}
                                size="m"
                                weight="thin"
                                onClick={() => setActive(type)}
                            >
                                {name}
                            </Text>
                            <Text size="xs" weight="thin" className={s.Description}>
                                {description}
                            </Text>
                        </div>
                        {nullable(active === type, () => (
                            <IconTickCircleOutline size="s" className={s.IconTick} />
                        ))}
                    </div>
                ))}
                <div className={s.FormActions}>
                    <Button type="button" text={tr('Cancel')} onClick={onClose} />
                    <Button
                        type="button"
                        view="primary"
                        text={tr('Create')}
                        onClick={() => {
                            active === 'dismiss' ? onDismiss() : onTransfer();
                            onClose();
                        }}
                        disabled={!active}
                    />
                </div>
            </ModalContent>
        </Modal>
    );
};
