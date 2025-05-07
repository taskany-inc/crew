import { ChangeEvent, useCallback, useEffect } from 'react';
import { Group, Role, User } from 'prisma/prisma-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@taskany/bricks';
import { ModalHeader, Modal, ModalContent, Text, Button, FormControlInput, ModalCross } from '@taskany/bricks/harmony';

import { FormControl } from '../FormControl/FormControl';
import { Nullish } from '../../utils/types';
import { AddUserToGroup, addUserToGroupSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';
import { FormActions } from '../FormActions/FormActions';
import { trpc } from '../../trpc/trpcClient';
import { UserSelect } from '../UserSelect/UserSelect';
import { RoleSelect } from '../RoleSelect/RoleSelect';
import { MembershipInfo } from '../../modules/userTypes';
import { useRoleMutations } from '../../modules/roleHooks';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';

import { tr } from './AddUserToTeamModal.i18n';
import s from './AddUserToTeamModal.module.css';

interface CreateUserModalProps {
    visible: boolean;
    onClose: VoidFunction;
    groupIdProps?: string;
    userIdProps?: string;
    type: string;
    membership?: MembershipInfo;
}

export const AddUserToTeamModal = ({
    visible,
    onClose,
    groupIdProps,
    userIdProps,
    type,
    membership,
}: CreateUserModalProps) => {
    const { addUserToGroup, updatePercentage } = useUserMutations();
    const { addToMembership, removeFromMembership } = useRoleMutations();

    const defaultValues = {
        userId: undefined,
        groupId: undefined,
        roles: undefined,
        percentage: undefined,
    };
    const methods = useForm<AddUserToGroup>({
        resolver: zodResolver(addUserToGroupSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        watch,
        trigger,
        formState: { errors },
    } = methods;

    const roles = watch('roles');
    const percentage = watch('percentage');

    const userId = watch('userId');
    const availableMembershipQuery = trpc.user.getAvailableMembershipPercentage.useQuery(userId, { enabled: !!userId });
    const max = availableMembershipQuery.data ?? 100;

    useEffect(() => {
        if (membership) {
            setValue('userId', membership.userId);
            setValue('roles', membership.roles);
            setValue('percentage', membership.percentage ? membership.percentage : undefined);
        }
        if (groupIdProps) {
            setValue('groupId', groupIdProps);
        }
        if (userIdProps) {
            setValue('userId', userIdProps);
        }
    }, [setValue, membership, groupIdProps, userIdProps]);

    const onSubmit = handleSubmit(async (data) => {
        await addUserToGroup(data);
        reset(defaultValues);
        onClose();
    });

    const onEdit = handleSubmit(async (data) => {
        if (data.percentage && membership && groupIdProps) {
            await updatePercentage({ membershipId: membership.id, groupId: data.groupId, percentage: data.percentage });
        }
        if (membership && data.roles && membership.roles[0]?.name !== data.roles[0].name) {
            if (membership.roles[0]) {
                await removeFromMembership({ membershipId: membership.id, roleId: membership.roles[0].id });
            }
            await addToMembership({ membershipId: membership.id, id: data.roles[0].id, type: 'existing' });
        }
        reset(defaultValues);
        onClose();
    });

    const onUserChange = useCallback(
        (user: Nullish<User>) => {
            if (user) {
                setValue('userId', user.id);
                trigger('userId');
            } else {
                reset({ ...defaultValues, userId: undefined });
            }
        },
        [reset, setValue, trigger, defaultValues],
    );

    const onRoleChange = (r: Nullish<Role>) => {
        r && setValue('roles', [r]);
        trigger('roles');
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const onPercentageChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const percentage = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
            setValue('percentage', percentage);
            if (percentage && percentage > max) {
                setError('percentage', { message: tr('Maximum value is {max}', { max }) });
            } else {
                clearErrors('percentage');
            }
        },
        [setValue, setError, clearErrors, max],
    );

    let role;

    if (roles) {
        role = roles[0] ? roles[0].name : undefined;
    }

    return (
        <Modal visible={visible} onClose={onClose} width={530}>
            <ModalHeader className={s.ModalHeader}>
                <Text weight="bold">{tr('Add team member')}</Text>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={type === 'edit' ? onEdit : onSubmit} className={s.Form}>
                    <FormControl label={type === 'user-page' ? tr('Team') : tr('Team member name')} required>
                        {type === 'user-page' ? (
                            <GroupComboBox
                                defaultGroupId={watch('groupId')}
                                onChange={onTeamChange}
                                error={errors.groupId}
                            />
                        ) : (
                            <UserSelect
                                readOnly={type === 'edit'}
                                mode="single"
                                selectedUsers={userId ? [userId] : undefined}
                                onChange={(users) => onUserChange(users[0])}
                                error={errors.userId}
                            />
                        )}
                    </FormControl>
                    <FormControl label={tr('Role')} required>
                        <RoleSelect onChange={onRoleChange} roleName={role} error={errors.roles} />
                    </FormControl>
                    <FormControl label={tr('Participation rate, %')} error={errors.percentage}>
                        <FormControlInput
                            placeholder={tr('Participation rate, %')}
                            outline
                            size="m"
                            autoComplete="off"
                            type="number"
                            step={1}
                            onChange={onPercentageChange}
                            value={percentage || undefined}
                        />
                    </FormControl>

                    <FormActions>
                        <Button type="button" text={tr('Cancel')} onClick={onClose} />
                        <Button
                            type="submit"
                            text={type === 'edit' ? tr('Save') : tr('Create')}
                            view="primary"
                            size="m"
                        />
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
