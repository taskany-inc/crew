import { useState } from 'react';
import { nullable } from '@taskany/bricks';
import { ModalHeader, Modal, ModalContent, Text, Button } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { IconTickCircleOutline } from '@taskany/icons';

import { useRouter } from '../../hooks/useRouter';

import s from './FireOrTransferUserModal.module.css';
import { tr } from './FireOrTransferUserModal.i18n';

interface FireOrTransferUserModalProps {
    visible: boolean;
    userId: string;
    onClose: VoidFunction;
    intern?: boolean;
}

type RequestPage = 'userTransferNew' | 'userDismissNew' | 'newTransferInternToStaff' | 'newTransferInside';

interface RequestTypeListType {
    name: string;
    description: string;
    type: RequestPage;
}

export const FireOrTransferUserModal = ({ visible, onClose, userId, intern }: FireOrTransferUserModalProps) => {
    const [active, setActive] = useState<RequestPage | undefined>();

    const requestTypeList: RequestTypeListType[] = [
        {
            name: tr('Create a planned dismiss'),
            description: tr('Informing about the dismiss of an employee'),
            type: 'userDismissNew',
        },
        {
            name: tr('Transfer employee'),
            description: tr('Informing about the transfer of an employee'),
            type: 'userTransferNew',
        },
    ];

    if (intern) {
        requestTypeList.push({
            name: tr('Transfer intern to staff'),
            description: tr('Informing about the transfer of an intern to the staff'),
            type: 'newTransferInternToStaff',
        });
    }

    if (!intern) {
        requestTypeList.push({
            name: tr('Transfer employee inside organization'),
            description: tr('Informing about the transfer of an employee inside organization'),
            type: 'newTransferInside',
        });
    }

    const router = useRouter();

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
                        onClick={() => active && router[active](userId)}
                        disabled={!active}
                    />
                </div>
            </ModalContent>
        </Modal>
    );
};
