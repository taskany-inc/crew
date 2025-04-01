import { useMemo } from 'react';
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
import { Checkbox } from '@taskany/bricks/harmony';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'prisma/prisma-client';
import { gray8 } from '@taskany/colors';

import { FormControl } from '../FormControl/FormControl';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { EditUser, editUserSchema } from '../../modules/userSchemas';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { useUserMutations } from '../../modules/userHooks';
import {
    UserCurators,
    UserSupervisorWithSupplementalPositions,
    UserSupplementalPositions,
} from '../../modules/userTypes';
import { SupplementalPositionItem } from '../SupplementalPositionItem/SupplementalPositionItem';
import { useSupplementalPositionMutations } from '../../modules/supplementalPositionHooks';
import { UserSelect } from '../UserSelect/UserSelect';

import { tr } from './UserUpdateForm.i18n';
import s from './UserUpdateForm.module.css';

interface UserDataFormProps {
    user: User & UserSupervisorWithSupplementalPositions & UserSupplementalPositions & UserCurators;
    onClose: () => void;
}

/* TODO: Add coordinator field https://github.com/taskany-inc/crew/issues/278*/
export const UserUpdateForm = ({ onClose, user }: UserDataFormProps) => {
    const { editUser } = useUserMutations();

    const { removeSupplementalPositionFromUser } = useSupplementalPositionMutations();

    const onSupplementalPositionRemove = (id: string) => {
        removeSupplementalPositionFromUser({ id, userId: user.id });
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { isSubmitted, errors },
    } = useForm<EditUser>({
        defaultValues: {
            id: user.id,
            supervisorId: user.supervisorId,
            name: user.name || undefined,
            savePreviousName: undefined,
            curatorIds: user.curators?.map(({ id }) => id),
        },
        mode: 'onChange',
        resolver: zodResolver(editUserSchema),
    });
    const curatorIds = watch('curatorIds');
    const savePreviousName = watch('savePreviousName') ?? false;

    const updateUser = async (data: EditUser) => {
        await editUser(data);
        onClose();
    };

    const supplementalPositions = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions;
    }, [user]);

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
                                {tr('Save previous name:')}
                            </Text>
                            <Checkbox
                                checked={savePreviousName}
                                onChange={(e) => setValue('savePreviousName', e.target.checked)}
                            />
                        </div>
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
                                {tr('Curators:')}
                            </Text>
                            <FormControl>
                                <UserSelect
                                    mode="multiple"
                                    selectedUsers={curatorIds}
                                    excludedUsers={[user.id]}
                                    onChange={(curators) =>
                                        setValue(
                                            'curatorIds',
                                            curators.map((user) => user.id),
                                        )
                                    }
                                    error={errors.curatorIds}
                                />
                            </FormControl>
                        </div>
                        {nullable(supplementalPositions, (positions) => (
                            <div className={s.BadgeWrapperList}>
                                <Text className={s.Text} weight="bold" color={gray8}>
                                    {tr('Supplemental:')}
                                </Text>
                                {positions.map((position) => (
                                    <SupplementalPositionItem
                                        key={position.id}
                                        supplementalPosition={{ ...position, unitId: position.unitId || '' }}
                                        removeSupplementalPosition={() => onSupplementalPositionRemove(position.id)}
                                    />
                                ))}
                            </div>
                        ))}
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
