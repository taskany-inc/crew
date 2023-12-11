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
import { EditUser, editUserSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';
import { UserMeta, UserSupervisor } from '../../modules/userTypes';

import { tr } from './UserUpdateForm.i18n';

interface UserDataFormProps {
    user: User & UserMeta & UserSupervisor;
    onClose: () => void;
}

const NoWrap = styled.div`
    white-space: nowrap;
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
const UserUpdateForm = ({ onClose, user }: UserDataFormProps) => {
    const { editUser } = useUserMutations();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { isSubmitted },
    } = useForm<EditUser>({
        defaultValues: {
            id: user.id,
            supervisorId: user.supervisorId,
            name: user.name || undefined,
        },
        mode: 'onChange',
        resolver: zodResolver(editUserSchema),
    });
    /* TODO: Add Notifications https://github.com/taskany-inc/crew/issues/279*/
    const updateUser = async (data: EditUser) => {
        await editUser.mutateAsync(data);
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

export default UserUpdateForm;
