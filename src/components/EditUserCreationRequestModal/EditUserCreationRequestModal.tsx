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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { EditUserCreationRequest, editUserCreationRequestSchema } from '../../modules/userCreationRequestSchemas';
import { UserRequest } from '../../trpc/inferredTypes';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import s from './EditUserCreationRequestModal.module.css';
import { tr } from './EditUserCreationRequestModal.i18n';

interface EditUserCreationRequestModalProps {
    visible: boolean;
    onClose: VoidFunction;
    request: UserRequest;
}

export const EditUserCreationRequestModal = ({ visible, onClose, request }: EditUserCreationRequestModalProps) => {
    const title = tr('Edit profile creation request for {nameAndOrganization}', {
        nameAndOrganization: `${request.name}(${getOrgUnitTitle(request.organization)})`,
    });
    const services = request.services as { serviceId: string; serviceName: string }[];

    const phone = services.find((service) => service.serviceName === 'Phone')?.serviceId;

    const defaultValues = {
        id: request.id,
        email: request.email,
        phone,
        date: request.date || undefined,
    };
    const { editUserCreationRequest } = useUserCreationRequestMutations();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<EditUserCreationRequest>({
        defaultValues,
        resolver: zodResolver(editUserCreationRequestSchema),
    });

    const onFormSubmit = handleSubmit(async (data) => {
        await editUserCreationRequest(data);
        reset(defaultValues);
        onClose();
    });

    const closeAndReset = () => {
        reset(defaultValues);
        onClose();
    };

    return (
        <Modal visible={visible} onClose={onClose} width={600} className={s.Modal}>
            <ModalHeader>
                <FormTitle>{title}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent className={s.ModalContent}>
                <Form onSubmit={onFormSubmit}>
                    <div className={s.NoWrap}>
                        <div className={s.InputContainer}>
                            <FormInput
                                label="Email"
                                brick="right"
                                autoComplete="off"
                                {...register('email', { required: tr('Required field') })}
                                error={errors.email}
                            />
                        </div>

                        <div className={s.InputContainer}>
                            <FormInput
                                label={tr('Phone')}
                                brick="right"
                                autoComplete="off"
                                {...register('phone')}
                                error={errors.phone}
                            />
                        </div>
                        <div className={s.InputContainer}>
                            <FormInput
                                label={tr('Date')}
                                defaultValue={request?.date?.toISOString().split('T')[0]}
                                type="date"
                                autoComplete="off"
                                onChange={(e) => e.target.valueAsDate && setValue('date', e.target.valueAsDate)}
                                className={s.Date}
                            />
                        </div>
                    </div>

                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={closeAndReset} />
                            <Button
                                type="submit"
                                text={tr('Save')}
                                view="primary"
                                size="m"
                                outline
                                disabled={isSubmitting || isSubmitSuccessful}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
