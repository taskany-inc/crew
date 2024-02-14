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
import { Vacancy } from 'prisma/prisma-client';
import { danger0, gapM, gapS, gray3, gray8 } from '@taskany/colors';

import { useVacancyMutations } from '../../modules/vacancyHooks';
import { EditVacancy, editVacancySchema } from '../../modules/vacancySchemas';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { RoleComboBox } from '../RoleComboBox/RoleComboBox';
import { VacancyStatusComboBox, statusesMap } from '../VacancyStatusComboBox/VacancyStatusComboBox';
import { VacancyGroup, VacancyHiringManager, VacancyHr } from '../../modules/vacancyTypes';

import { tr } from './UpdateVacancyModal.i18n';

interface UpdateVacancyModalProps {
    visible: boolean;
    onClose: VoidFunction;
    vacancy: Vacancy & VacancyGroup & VacancyHr & VacancyHiringManager;
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

export const UpdateVacancyModal = ({ visible, onClose, vacancy }: UpdateVacancyModalProps) => {
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
                        teamName: vacancy.group.name,
                    })}
                </FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <NoWrap>
                        <StyledInputContainer>
                            <Text weight="bold" color={gray8}>
                                {tr('Name:')}
                            </Text>
                            <RoleComboBox
                                roleName={vacancy.name}
                                onChange={(role) => role && setValue('name', role.name)}
                            />
                            {nullable(errors.name, (e) => (
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
                                status={statusesMap[vacancy.status]}
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
                                user={vacancy.hiringManager}
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
                            <UserComboBox user={vacancy.hr} onChange={(user) => user && setValue('hrId', user?.id)} />
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
                                defaultValue={vacancy.grade!}
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
                                defaultValue={vacancy.unit!}
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
