import { ReactNode } from 'react';
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
import { Vacancy } from '@prisma/client';
import { danger0, gapM, gapS, gray3, gray8 } from '@taskany/colors';

import { useVacancyMutations } from '../../modules/vacancyHooks';
import { EditVacancy, editVacancySchema } from '../../modules/vacancySchemas';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { RoleComboBox } from '../RoleComboBox/RoleComboBox';
import { VacancyStatusComboBox, statusesMap } from '../VacancyStatusComboBox/VacancyStatusComboBox';
import { VacancyHiringManager, VacancyHr } from '../../modules/vacancyTypes';

import { tr } from './UpdateVacancyModal.i18n';

interface UpdateVacancyModalProps {
    visible: boolean;
    onClose: VoidFunction;
    vacancy: Vacancy & VacancyHr & VacancyHiringManager;
    groupName: string;
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

export const UpdateVacancyModal = ({ visible, onClose, vacancy, groupName }: UpdateVacancyModalProps) => {
    const { editVacancy } = useVacancyMutations();

    const {
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<EditVacancy>({
        defaultValues: {
            id: vacancy.id,
            name: vacancy.name,
            hiringManagerId: vacancy.hiringManagerId,
            status: vacancy.status,
            hrId: vacancy.hrId,
            grade: vacancy.grade || undefined,
            unit: vacancy.unit || undefined,
        },
        resolver: zodResolver(editVacancySchema),
    });

    const closeAndReset = () => {
        reset();
        onClose();
    };

    const onSubmit = handleSubmit((data) =>
        editVacancy(data)
            .then(() => closeAndReset())
            .catch(() => {
                //  Error is already catched
            }),
    );

    return (
        <Modal visible={visible} onClose={closeAndReset} width={600}>
            <ModalHeader>
                <FormTitle>
                    {tr('Update vacancy {vacancyName} for team {teamName}', {
                        vacancyName: vacancy.name,
                        teamName: groupName,
                    })}
                </FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <NoWrap>
                        <StyledInputsContainer>
                            <Field name={tr('Name:')} error={errors.name}>
                                <RoleComboBox
                                    roleName={vacancy.name}
                                    onChange={(role) => role && setValue('name', role.name)}
                                />
                            </Field>

                            <Field name={tr('Vacancy status:')} error={errors.status}>
                                <VacancyStatusComboBox
                                    status={statusesMap[vacancy.status]}
                                    onChange={(status) => status && setValue('status', status.id)}
                                />
                            </Field>

                            <Field name={tr('Hiring manager:')} error={errors.hiringManagerId}>
                                <UserComboBox
                                    value={vacancy.hiringManager}
                                    onChange={(user) => user && setValue('hiringManagerId', user?.id)}
                                />
                            </Field>

                            <Field name={tr('HR:')} error={errors.hrId}>
                                <UserComboBox
                                    value={vacancy.hr}
                                    onChange={(user) => user && setValue('hrId', user?.id)}
                                />
                            </Field>

                            <Field name={tr('Grade:')} error={errors.grade}>
                                <Input
                                    defaultValue={vacancy.grade || undefined}
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
                                    defaultValue={vacancy.unit || undefined}
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
                            <Button type="button" text={tr('Cancel')} onClick={closeAndReset} />
                            <Button
                                type="submit"
                                text={tr('Save')}
                                view="primary"
                                size="m"
                                outline
                                disabled={isSubmitting}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
