import { useState } from 'react';
import { nullable } from '@taskany/bricks';
import { ModalHeader, Modal, ModalContent, Text, Button } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { IconTickCircleOutline } from '@taskany/icons';

import { useRouter } from '../../hooks/useRouter';
import { config } from '../../config';

import s from './CreateUserModal.module.css';
import { tr } from './CreateUserModal.i18n';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

type RequestPage =
    | 'newInternalUserRequest'
    | 'newExternalUserRequest'
    | 'newExternalFromMainUserRequest'
    | 'newExistingUserRequest';

interface RequestTypeListType {
    name: string;
    description: string;
    page: RequestPage;
}

export const CreateUserModal = ({ visible, onClose }: CreateUserModalProps) => {
    const [active, setActive] = useState<RequestPage | undefined>();

    const requestTypeList: RequestTypeListType[] = [
        {
            name: tr('Create a planned newcommer'),
            description: tr('Informing about the departure of a new employee'),
            page: 'newInternalUserRequest',
        },
        {
            name: tr('Access employee'),
            description: tr('existing  description'),
            page: 'newExistingUserRequest',
        },
        {
            name: tr('Create access to employee from {mainOrgName} (external)', {
                mainOrgName: config.mainOrganizationName || 'Main',
            }),
            description: tr('external from main description {mainOrgName}', {
                mainOrgName: config.mainOrganizationName || 'Main',
            }),
            page: 'newExternalFromMainUserRequest',
        },
        {
            name: tr('Access to external employees {mainOrgName}', {
                mainOrgName: config.mainOrganizationName || 'Main',
            }),
            description: tr('external  description'),
            page: 'newExternalUserRequest',
        },
    ];

    const router = useRouter();
    return (
        <Modal visible={visible} onClose={onClose} width={530}>
            <ModalHeader>
                <Text weight="bold">{tr('Which request you want to create?')}</Text>
            </ModalHeader>

            <ModalContent>
                {requestTypeList.map(({ name, description, page }) => (
                    <div className={s.RequestType} key={page}>
                        <div>
                            <Text
                                className={cn(s.Text, {
                                    [s.Text_active]: active === page,
                                })}
                                size="m"
                                weight="thin"
                                onClick={() => setActive(page)}
                            >
                                {name}
                            </Text>
                            <Text size="xs" weight="thin" className={s.Description}>
                                {description}
                            </Text>
                        </div>
                        {nullable(active === page, () => (
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
                        onClick={() => active && router[active]()}
                        disabled={!active}
                    />
                </div>
            </ModalContent>
        </Modal>
    );
};
