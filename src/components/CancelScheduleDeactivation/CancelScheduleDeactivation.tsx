import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormInput,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
} from '@taskany/bricks';
import { ScheduledDeactivation, User } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';
import {
    CancelScheduledDeactivation,
    cancelScheduledDeactivationSchema,
} from '../../modules/scheduledDeactivationSchemas';

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

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CancelScheduledDeactivation>({
        resolver: zodResolver(cancelScheduledDeactivationSchema),
        defaultValues: {
            id: scheduledDeactivation.id,
        },
    });

    const onSubmit = handleSubmit((data) => {
        cancelScheduledDeactivation(data);
        onClose();
    });

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>
                    {tr('Cancel deactivation profile of')} {scheduledDeactivation.user.name}
                </FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <FormInput
                        {...register('comment')}
                        autoComplete="off"
                        placeholder={tr('comment')}
                        error={errors.comment}
                    />
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('No, I changed my mind')} onClick={onClose} type="button" />
                            <Button
                                size="m"
                                view="danger"
                                type="submit"
                                onClick={onSubmit}
                                text={tr('Yes')}
                                disabled={isSubmitting || isSubmitSuccessful}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
