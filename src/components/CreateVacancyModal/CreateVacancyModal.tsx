import { useEffect } from 'react';
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
} from '@taskany/bricks';
import { gapM, gapS, gapXs, gray3, gray8 } from '@taskany/colors';

import { useRouter } from '../../hooks/useRouter';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { useVacancyMutations } from '../../modules/vacancyHooks';
import { CreateVacancy, createVacancySchema } from '../../modules/vacancySchemas';
import { HireStreamComboBox } from '../HireStreamComboBox/HireStreamComboBox';
import { constructLinkToHireStream } from '../../utils/hireIntegration';

import { tr } from './CreateVacancyModal.i18n';

interface CreateVacancyModalProps {
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

export const CreateVacancyModal = ({ visible, onClose }: CreateVacancyModalProps) => {
    const { createVacancy } = useVacancyMutations();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateVacancy>({ resolver: zodResolver(createVacancySchema) });

    const onSubmit = handleSubmit(async (data) => {
        const newVacancy = await createVacancy(data);
        router.team(newVacancy.groupId);
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
                <FormTitle>{tr('Create vacancy')}</FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <NoWrap>
                        <FormInput
                            label={tr('Name')}
                            brick="right"
                            autoComplete="off"
                            {...register('name', { required: tr('Required field') })}
                            error={errors.name}
                        />

                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Hire stream:')}
                            </Text>
                            <HireStreamComboBox
                                onChange={(hireStream) =>
                                    hireStream && setValue('hireStream', constructLinkToHireStream(hireStream.id))
                                }
                            />
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Team:')}
                            </Text>
                            <GroupComboBox onChange={(group) => group && setValue('groupId', group?.id)} />
                        </StyledInputContainer>
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
