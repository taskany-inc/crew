import { ChangeEvent, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    Text,
    nullable,
} from '@taskany/bricks';
import { danger0, gapM, gapS, gapXs, gray3, gray8 } from '@taskany/colors';
import { Checkbox } from '@taskany/bricks/harmony';

import { useUserMutations } from '../../modules/userHooks';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { CreateUserCreationRequest, createUserCreationRequestSchema } from '../../modules/userSchemas';

import { tr } from './CreateUserModal.i18n';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

const NoWrap = styled.div`
    white-space: nowrap;
`;

const StyledInputContainer = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    padding: ${gapXs} ${gapM};
    background-color: ${gray3};
`;

export const CreateUserModal = ({ visible, onClose }: CreateUserModalProps) => {
    const { createUserCreationRequest } = useUserMutations();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateUserCreationRequest>({
        resolver: zodResolver(createUserCreationRequestSchema),
        defaultValues: { createExternalAccount: true },
    });

    const createExternalAccount = watch('createExternalAccount');

    const onCreateExternalAccountClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('createExternalAccount', e.target.checked);
    };

    const onSubmit = handleSubmit(async (data) => {
        await createUserCreationRequest(data);

        onClose();
    });

    useEffect(() => {
        reset();
    }, [reset, isSubmitSuccessful]);

    const closeAndReset = () => {
        reset();
        onClose();
    };

    return (
        <Modal visible={visible} onClose={closeAndReset} width={600}>
            <ModalHeader>
                <FormTitle>{tr('Create user')}</FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <NoWrap>
                        <FormInput
                            label={tr('Surname')}
                            brick="right"
                            autoComplete="off"
                            {...register('surname', { required: tr('Required field') })}
                            error={errors.surname}
                        />
                        <FormInput
                            label={tr('First name')}
                            brick="right"
                            autoComplete="off"
                            {...register('firstName', { required: tr('Required field') })}
                            error={errors.firstName}
                        />
                        <FormInput
                            label={tr('Middle name')}
                            brick="right"
                            autoComplete="off"
                            {...register('middleName')}
                            error={errors.middleName}
                        />
                        <FormInput
                            label={tr('Email')}
                            brick="right"
                            autoComplete="off"
                            {...register('email', { required: tr('Required field') })}
                            error={errors.email}
                        />
                        <FormInput
                            label={tr('Login')}
                            brick="right"
                            autoComplete="off"
                            {...register('login', { required: tr('Required field') })}
                            error={errors.login}
                        />
                        <FormInput
                            label={tr('Phone')}
                            brick="right"
                            autoComplete="off"
                            {...register('phone')}
                            error={errors.phone}
                        />
                        <FormInput
                            label={tr('Accounting id')}
                            brick="right"
                            autoComplete="off"
                            {...register('accountingId')}
                            error={errors.accountingId}
                        />
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Supervisor:')}
                            </Text>
                            <UserComboBox onChange={(user) => user && setValue('supervisorId', user.id)} />
                            {nullable(errors.supervisorId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Team:')}
                            </Text>
                            <GroupComboBox onChange={(group) => group && setValue('groupId', group.id)} />
                            {nullable(errors.groupId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Organization:')}
                            </Text>

                            <OrganizationUnitComboBox
                                onChange={(group) => group && setValue('organizationUnitId', group.id)}
                            />
                            {nullable(errors.organizationUnitId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Create external account:')}
                            </Text>
                            <Checkbox
                                value="createExternalAccount"
                                checked={createExternalAccount}
                                onChange={onCreateExternalAccountClick}
                            />
                        </StyledInputContainer>

                        <FormInput
                            type="date"
                            autoComplete="off"
                            onChange={(e) => e.target.valueAsDate && setValue('date', e.target.valueAsDate)}
                        />
                    </NoWrap>

                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={onClose} />
                            <Button
                                type="submit"
                                text={tr('Create')}
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
