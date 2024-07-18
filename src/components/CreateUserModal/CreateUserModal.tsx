import { useState } from 'react';
import { FormTitle, Modal, ModalContent, ModalCross, ModalHeader, nullable } from '@taskany/bricks';
import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { CreateUserCreationRequest } from '../../modules/userCreationRequestSchemas';
import { CreateUserCreationRequestInternalEmployeeForm } from '../CreateUserCreationRequestInternalEmployeeForm/CreateUserCreationRequestInternalEmployeeForm';
import { CreateUserCreationRequestBaseForm } from '../CreateUserCreationRequestBaseForm/CreateUserCreationRequestBaseForm';
import { CreateUserCreationRequestExternalEmployeeForm } from '../CreateUserCreationRequestExternalEmployeeForm/CreateUserCreationRequestExternalEmployeeForm';

import s from './CreateUserModal.module.css';
import { tr } from './CreateUserModal.i18n';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

export const CreateUserModal = ({ visible, onClose }: CreateUserModalProps) => {
    const [type, setType] = useState<CreateUserCreationRequest['type']>('internalEmployee');
    let title = tr('Create request for user creation');

    if (type === 'internalEmployee') title = tr('Create request for planned employment');

    if (type === 'externalEmployee') title = tr('Create access for external user');
    return (
        <Modal visible={visible} onClose={onClose} width={600} className={s.Modal}>
            <ModalHeader>
                <FormTitle>{title}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent className={s.ModalContent}>
                <Switch
                    value={type}
                    onChange={(e, active) => setType(active as CreateUserCreationRequest['type'])}
                    className={s.TypeSwitch}
                >
                    <SwitchControl text={tr('Internal employee')} value="internalEmployee" />
                    <SwitchControl text={tr('External employee')} value="externalEmployee" />
                    <SwitchControl text={tr('Existing')} value="base" />
                </Switch>

                {nullable(type === 'base', () => (
                    <CreateUserCreationRequestBaseForm onClose={onClose} onSubmit={onClose} />
                ))}

                {nullable(type === 'externalEmployee', () => (
                    <CreateUserCreationRequestExternalEmployeeForm onClose={onClose} onSubmit={onClose} />
                ))}

                {nullable(type === 'internalEmployee', () => (
                    <CreateUserCreationRequestInternalEmployeeForm onClose={onClose} onSubmit={onClose} />
                ))}
            </ModalContent>
        </Modal>
    );
};
