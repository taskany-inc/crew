import { useForm } from 'react-hook-form';
import {
    Button,
    Form,
    ModalContent,
    FormActions,
    FormAction,
    FormInput,
    FormTitle,
    ModalHeader,
    ModalCross,
    Text,
} from '@taskany/bricks';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import { User } from 'prisma/prisma-client';
import { gapM, gray8 } from '@taskany/colors';

import { UserComboBox } from '../UserComboBox/UserComboBox';
import { EditUser, EditUserFields, editUserFieldsSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';
import { UserOrganizationUnit, UserSupervisor } from '../../modules/userTypes';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';

import { tr } from './UserUpdateForm.i18n';

interface UserDataFormProps {
    user: User & UserSupervisor & UserOrganizationUnit;
    onClose: () => void;
}

const NoWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
`;

const StyledSupervisorField = styled.div`
    display: inline-flex;
    align-items: center;
`;

const StyledTextSupervisor = styled(Text)`
    padding-left: ${gapM};
    margin-right: ${gapM};
`;

/* TODO: Add coordinator field https://github.com/taskany-inc/crew/issues/278*/
export const UserUpdateForm = ({ onClose, user }: UserDataFormProps) => {
    const { editUser } = useUserMutations();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { isSubmitted },
    } = useForm<EditUserFields>({
        defaultValues: {
            id: user.id,
            supervisorId: user.supervisorId,
            name: user.name || undefined,
            organizationUnitId: user.organizationUnitId || undefined,
        },
        mode: 'onChange',
        resolver: zodResolver(editUserFieldsSchema),
    });

    const updateUser = async (data: EditUser) => {
        await editUser(data);
        onClose();
    };

    return (
        <>
            <ModalHeader>
                <FormTitle> {tr('Update profile')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(updateUser)}>
                    <NoWrap>
                        <FormInput
                            label={tr('Full Name')}
                            {...register('name')}
                            flat="bottom"
                            brick="right"
                            autoComplete="off"
                        />
                        <StyledSupervisorField>
                            <StyledTextSupervisor weight="bold" color={gray8}>
                                {tr('Supervisor:')}
                            </StyledTextSupervisor>
                            <UserComboBox
                                user={user.supervisor}
                                onChange={(newUser) => {
                                    setValue('supervisorId', newUser?.id);
                                }}
                            />
                        </StyledSupervisorField>
                        <StyledSupervisorField>
                            <StyledTextSupervisor weight="bold" color={gray8}>
                                {tr('Organization')}:
                            </StyledTextSupervisor>
                            <OrganizationUnitComboBox
                                organizationUnit={user.organizationUnit}
                                onChange={(organizationUnit) => {
                                    setValue('organizationUnitId', organizationUnit?.id);
                                }}
                            />
                        </StyledSupervisorField>
                    </NoWrap>

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={onClose} />
                            <Button
                                type="submit"
                                text={tr('Save')}
                                view="primary"
                                size="m"
                                outline
                                disabled={isSubmitted}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};
