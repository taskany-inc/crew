import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormTextarea,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
} from '@taskany/bricks';
import { useState } from 'react';

import { UserRequest } from '../../trpc/inferredTypes';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import { tr } from './CancelUserCreationRequestModal.i18n';

interface CancelUserCreationRequestModalProps {
    visible: boolean;
    request: UserRequest;
    onClose: VoidFunction;
}

export const CancelUserCreationRequestModal = ({ visible, request, onClose }: CancelUserCreationRequestModalProps) => {
    const { cancelUserRequest } = useUserCreationRequestMutations();
    const [comment, setComment] = useState('');

    const onYesClick = async () => {
        await cancelUserRequest({ id: request.id, comment });
        onClose();
    };

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>
                    {tr('Cancel request to create profile to')} {request.name}
                </FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form>
                    <FormTextarea
                        onChange={(e) => setComment(e.currentTarget.value)}
                        minHeight={180}
                        autoComplete="off"
                        placeholder={tr('comment')}
                    />
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('No, I changed my mind')} onClick={onClose} />
                            <Button size="m" view="danger" onClick={onYesClick} text={tr('Yes')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
