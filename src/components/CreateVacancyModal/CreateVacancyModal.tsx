import { ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { FieldError, useForm } from 'react-hook-form';
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
import { RecruiterComboBox } from '../RecruiterComboBox/RecruiterComboBox';

import { tr } from './CreateVacancyModal.i18n';

interface CreateVacancyModalProps {
    visible: boolean;
    onClose: VoidFunction;
    group: Group & GroupSupervisor;
}

const NoWrap = styled.div`
    white-space: nowrap;
`;

const StyledInputsContainer = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: ${gapS};
    align-items: center;
    background-color: var(--gray3);
    padding-left: ${gapM};
    padding-bottom: ${gapS};
    background-color: ${gray3};
`;

const Field = (props: { name: string; error: FieldError | undefined; children: ReactNode }) => (
    <>
        <Text weight="bold" color={gray8}>
            {props.name}
        </Text>
        <div>
            {props.children}
            {nullable(props.error, (e) => (
                <Text size="xs" color={danger0}>
                    {e.message}
                </Text>
            ))}
        </div>
    </>
);

export const CreateVacancyModal = ({ visible, onClose, group }: CreateVacancyModalProps) => {
    const { createVacancy } = useVacancyMutations();

    const {
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateVacancy>({
        defaultValues: {
            groupId: group.id,
            hiringManagerId: group.supervisorId || undefined,
            status: VacancyStatus.ACTIVE,
        },
        resolver: zodResolver(createVacancySchema),
    });

    const hireStreamId = Number(watch('hireStreamId') ?? 0);

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
                        <StyledInputsContainer>
                            <Field name={tr('Name:')} error={errors.name}>
                                <RoleComboBox onChange={(role) => role && setValue('name', role.name)} />
                            </Field>

                            <Field name={tr('Hire stream:')} error={errors.hireStreamId}>
                                <HireStreamComboBox
                                    onChange={(hireStream) =>
                                        hireStream && setValue('hireStreamId', String(hireStream.id))
                                    }
                                />
                            </Field>

                            <Field name={tr('Vacancy status:')} error={errors.status}>
                                <VacancyStatusComboBox
                                    status={statusesMap.ACTIVE}
                                    onChange={(status) => status && setValue('status', status.id)}
                                />
                            </Field>

                            <Field name={tr('Hiring manager:')} error={errors.hiringManagerId}>
                                <UserComboBox
                                    user={group.supervisor}
                                    onChange={(user) => user && setValue('hiringManagerId', user?.id)}
                                />
                            </Field>

                            <Field name={tr('HR:')} error={errors.hrId}>
                                <RecruiterComboBox
                                    hireStreamId={hireStreamId}
                                    onChange={(user) => user && setValue('hrId', user?.id)}
                                />
                            </Field>

                            <Field name={tr('Grade:')} error={errors.grade}>
                                <Input
                                    placeholder={tr('Enter the grade value')}
                                    type="number"
                                    autoComplete="off"
                                    onChange={(e) =>
                                        setValue('grade', e.target.value ? Number(e.target.value) : undefined)
                                    }
                                />
                            </Field>

                            <Field name={tr('Unit:')} error={errors.unit}>
                                <Input
                                    placeholder={tr('Enter the unit value')}
                                    type="number"
                                    autoComplete="off"
                                    onChange={(e) =>
                                        setValue('unit', e.target.value ? Number(e.target.value) : undefined)
                                    }
                                />
                            </Field>
                        </StyledInputsContainer>
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
