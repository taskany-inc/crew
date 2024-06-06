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
import { ScheduledDeactivation, User } from '@prisma/client';
import { useState } from 'react';

import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';

import { tr } from './CancelScheduleDeactivation.i18n';

interface CancelScheduleDeactivationProps {
    visible: boolean;
    scheduledDeactivation: ScheduledDeactivation & { user: User };
    onClose: VoidFunction;
}

export const CancelScheduleDeactivation = ({
    visible,
    scheduledDeactivation,
    onClose,
}: CancelScheduleDeactivationProps) => {
    const { cancelScheduledDeactivation } = useScheduledDeactivation();
    const [comment, setComment] = useState('');

    const onYesClick = async () => {
        await cancelScheduledDeactivation({ id: scheduledDeactivation.id, comment });
        onClose();
    };

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>
                    {tr('Cancel deactivation profile of')} {scheduledDeactivation.user.name}
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
