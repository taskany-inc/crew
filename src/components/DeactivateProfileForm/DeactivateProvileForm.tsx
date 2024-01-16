import { useForm } from 'react-hook-form';
import {
    Button,
    Form,
    ModalContent,
    FormActions,
    FormAction,
    FormTitle,
    ModalHeader,
    ModalCross,
    FormCard,
} from '@taskany/bricks';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { warn0 } from '@taskany/colors';
import { useCallback } from 'react';

import { EditUser, editUserSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';

import { tr } from './DeactivateProfileForm.i18n';

interface DeactivateProfileFormProps {
    user: User;
    onClose: () => void;
}

const StyledFormCard = styled(FormCard)`
    border-color: ${warn0};
`;

export const DeactivateProfileForm = ({ onClose, user }: DeactivateProfileFormProps) => {
    const { editUser } = useUserMutations();

    const {
        handleSubmit,
        formState: { isSubmitted },
    } = useForm<EditUser>({
        mode: 'onChange',
        resolver: zodResolver(editUserSchema),
    });

    const updateUser = useCallback(async () => {
        await editUser({ id: user.id, active: !user.active });
        onClose();
    }, [user, editUser, onClose]);

    return (
        <>
            <ModalHeader>
                <FormTitle> {user.active ? tr('Deactivate profile?') : tr('Reactivate profile?')}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(updateUser)}>
                    <StyledFormCard>
                        {tr('Are You sure?')}
                        <FormActions flat="top">
                            <FormAction left />
                            <FormAction right inline>
                                <Button type="button" text={tr('Cancel')} onClick={onClose} />
                                <Button
                                    type="submit"
                                    text={tr('Yes')}
                                    view="warning"
                                    disabled={isSubmitted}
                                    size="m"
                                    outline
                                    onClick={updateUser}
                                />
                            </FormAction>
                        </FormActions>
                    </StyledFormCard>
                </Form>
            </ModalContent>
        </>
    );
};
