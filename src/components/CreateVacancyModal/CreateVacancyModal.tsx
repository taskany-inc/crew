import { useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    Input,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    nullable,
} from '@taskany/bricks';
import { Group, VacancyStatus } from 'prisma/prisma-client';
import { danger0, gapM, gapS, gray3, gray8 } from '@taskany/colors';

import { useVacancyMutations } from '../../modules/vacancyHooks';
import { CreateVacancy, createVacancySchema } from '../../modules/vacancySchemas';
import { HireStreamComboBox } from '../HireStreamComboBox/HireStreamComboBox';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { RoleComboBox } from '../RoleComboBox/RoleComboBox';
import { VacancyStatusComboBox, statusesMap } from '../VacancyStatusComboBox/VacancyStatusComboBox';
import { GroupSupervisor } from '../../modules/groupTypes';

import { tr } from './CreateVacancyModal.i18n';

interface CreateVacancyModalProps {
    visible: boolean;
    onClose: VoidFunction;
    group: Group & GroupSupervisor;
}

const NoWrap = styled.div`
    white-space: nowrap;
`;

const StyledInputContainer = styled.div`
    display: grid;
    grid-template-columns: 120px 1fr 1fr;
    gap: ${gapS};
    width: 100%;
    align-items: center;
    background-color: var(--gray3);
    padding-left: ${gapM};
    padding-bottom: ${gapS};
    background-color: ${gray3};
`;

export const CreateVacancyModal = ({ visible, onClose, group }: CreateVacancyModalProps) => {
    const { createVacancy } = useVacancyMutations();

    const {
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateVacancy>({
        defaultValues: {
            groupId: group.id,
            hiringManagerId: group.supervisorId || undefined,
            status: VacancyStatus.ACTIVE,
        },
        resolver: zodResolver(createVacancySchema),
    });

    const onSubmit = handleSubmit(async (data) => {
        await createVacancy(data);
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
                <FormTitle>{tr('Create vacancy for team {teamName}', { teamName: group.name })}</FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <NoWrap>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Name:')}
                            </Text>
                            <RoleComboBox onChange={(role) => role && setValue('name', role.name)} />
                            {nullable(errors.name, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>

                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Hire stream:')}
                            </Text>
                            <HireStreamComboBox
                                onChange={(hireStream) => hireStream && setValue('hireStreamId', String(hireStream.id))}
                            />
                            {nullable(errors.hireStreamId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>

                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Vacancy status:')}
                            </Text>
                            <VacancyStatusComboBox
                                status={statusesMap.ACTIVE}
                                onChange={(status) => status && setValue('status', status.id)}
                            />
                            {nullable(errors.status, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>

                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Hiring manager:')}
                            </Text>
                            <UserComboBox
                                user={group.supervisor}
                                onChange={(user) => user && setValue('hiringManagerId', user?.id)}
                            />
                            {nullable(errors.hiringManagerId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('HR:')}
                            </Text>
                            <UserComboBox onChange={(user) => user && setValue('hrId', user?.id)} />
                            {nullable(errors.hrId, (e) => (
                                <Text size="xs" color={danger0}>
                                    {e.message}
                                </Text>
                            ))}
                        </StyledInputContainer>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Grade:')}
                            </Text>
                            <Input
                                placeholder={tr('Enter the grade value')}
                                type="number"
                                autoComplete="off"
                                onChange={(e) => setValue('grade', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </StyledInputContainer>

                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Unit:')}
                            </Text>
                            <Input
                                placeholder={tr('Enter the unit value')}
                                type="number"
                                autoComplete="off"
                                onChange={(e) => setValue('unit', e.target.value ? Number(e.target.value) : undefined)}
                            />
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
