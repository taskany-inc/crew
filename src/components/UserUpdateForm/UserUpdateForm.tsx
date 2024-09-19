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
    nullable,
} from '@taskany/bricks';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'prisma/prisma-client';
import { gray8 } from '@taskany/colors';

import { UserComboBox } from '../UserComboBox/UserComboBox';
import { EditUser, EditUserFields, editUserFieldsSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';
import { UserOrganizationUnit, UserSupervisor, UserSupplementalPositions } from '../../modules/userTypes';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { SupplementalPositionItem } from '../SupplementalPositionItem/SupplementalPositionItem';
import { useSupplementalPositionMutations } from '../../modules/supplementalPositionHooks';
import { AddSupplementalPositionType } from '../../modules/organizationUnitSchemas';

import { tr } from './UserUpdateForm.i18n';
import s from './UserUpdateForm.module.css';

interface UserDataFormProps {
    user: User & UserSupervisor & UserOrganizationUnit & UserSupplementalPositions;
    onClose: () => void;
}

/* TODO: Add coordinator field https://github.com/taskany-inc/crew/issues/278*/
export const UserUpdateForm = ({ onClose, user }: UserDataFormProps) => {
    const { editUser } = useUserMutations();

    const { addSupplementalPositionToUser, removeSupplementalPositionFromUser } = useSupplementalPositionMutations();

    const onSupplementalPositionSubmit = (data: AddSupplementalPositionType) => {
        addSupplementalPositionToUser({
            userId: user.id,
            percentage: data.percentage,
            organizationUnitId: data.organizationUnit.id,
        });
    };

    const onSupplementalPositionRemove = (id: string) => {
        removeSupplementalPositionFromUser({ id, userId: user.id });
    };

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
                    <div className={s.NoWrap}>
                        <FormInput
                            label={tr('Full Name')}
                            {...register('name')}
                            flat="bottom"
                            brick="right"
                            autoComplete="off"
                        />
                        <div className={s.Field}>
                            <Text className={s.Text} weight="bold" color={gray8}>
                                {tr('Supervisor:')}
                            </Text>
                            <UserComboBox
                                value={user.supervisor}
                                onChange={(newUser) => {
                                    setValue('supervisorId', newUser?.id || null);
                                }}
                            />
                        </div>
                        <div className={s.Field}>
                            <Text className={s.Text} weight="bold" color={gray8}>
                                {tr('Organization')}:
                            </Text>
                            <OrganizationUnitComboBox
                                organizationUnit={user.organizationUnit}
                                onChange={(organizationUnit) => {
                                    setValue('organizationUnitId', organizationUnit?.id);
                                }}
                            />
                        </div>
                        {nullable(!!user.supplementalPositions.length, () => (
                            <div className={s.BadgeWrapperList}>
                                <Text className={s.Text} weight="bold" color={gray8}>
                                    {tr('Supplemental:')}
                                </Text>
                                {user.supplementalPositions.map((position) => (
                                    <SupplementalPositionItem
                                        key={position.id}
                                        supplementalPosition={{ ...position, unitId: position.unitId || '' }}
                                        removeSupplementalPosition={() => onSupplementalPositionRemove(position.id)}
                                    />
                                ))}
                            </div>
                        ))}
                        <AddSupplementalPosition onSubmit={onSupplementalPositionSubmit} />
                    </div>

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
