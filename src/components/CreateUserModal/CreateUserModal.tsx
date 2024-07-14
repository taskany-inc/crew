import { useState } from 'react';
import { FormTitle, Modal, ModalContent, ModalCross, ModalHeader, nullable } from '@taskany/bricks';
import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { CreateUserCreationRequest } from '../../modules/userCreationRequestSchemas';
import { CreateUserCreationRequestBaseForm } from '../CreateUserCreationRequestBaseForm/CreateUserCreationRequestBaseForm';
import { CreateUserCreationRequestExternalEmployeeForm } from '../CreateUserCreationRequestExternalEmployeeForm/CreateUserCreationRequestExternalEmployeeForm';

import s from './CreateUserModal.module.css';
import { tr } from './CreateUserModal.i18n';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

export const CreateUserModal = ({ visible, onClose }: CreateUserModalProps) => {
    const [type, setType] = useState<CreateUserCreationRequest['type']>('base');

    return (
        <Modal visible={visible} onClose={onClose} width={600} className={s.Modal}>
            <ModalHeader>
                <FormTitle>{tr('Create request for user creation')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent className={s.ModalContent}>
                <Switch
                    value={type}
                    onChange={(e, active) => setType(active as CreateUserCreationRequest['type'])}
                    className={s.TypeSwitch}
                >
                    <SwitchControl text={tr('Regular')} value="base" />
                    <SwitchControl text={tr('Internal employee')} value="internalEmployee" />
                    <SwitchControl text={tr('External employee')} value="externalEmployee" />
                </Switch>

                {nullable(type === 'base', () => (
                    <CreateUserCreationRequestBaseForm onClose={onClose} onSubmit={onClose} />
                ))}

                {nullable(type === 'externalEmployee', () => (
                    <CreateUserCreationRequestExternalEmployeeForm onClose={onClose} onSubmit={onClose} />
                ))}
            </ModalContent>
        </Modal>
    );
};
