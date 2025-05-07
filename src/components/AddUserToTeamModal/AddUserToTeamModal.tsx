import { ChangeEvent, useCallback } from 'react';
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

interface BaseProps {
    visible: boolean;
    onClose: VoidFunction;
    type: string;
}

interface AddUserToTeamPageModalProps extends BaseProps {
    type: 'user-to-team';
    groupId: string;
}

interface EditUserModalProps extends BaseProps {
    type: 'edit';
    groupId: string;
    membership: MembershipInfo;
}

interface AddTeamToUserPageModalProps extends BaseProps {
    type: 'team-to-user';
    userId: string;
}

type AddUserModalProps = AddUserToTeamPageModalProps | EditUserModalProps | AddTeamToUserPageModalProps;

export const AddUserToTeamModal = (props: AddUserModalProps) => {
    const { addUserToGroup, updatePercentage } = useUserMutations();
    const { addToMembership, removeFromMembership } = useRoleMutations();

    const defaultValues = {
        userId:
            (props.type === 'team-to-user' && props.userId) ||
            (props.type === 'edit' && props.membership.userId) ||
            undefined,
        groupId:
            (props.type === 'user-to-team' && props.groupId) ||
            (props.type === 'edit' && props.membership.id) ||
            undefined,
        roles: (props.type === 'edit' && props.membership.roles) || undefined,
        percentage: (props.type === 'edit' && props.membership.percentage) || undefined,
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

    const rolesValue = watch('roles');

    const userIdValue = watch('userId');
    const availableMembershipQuery = trpc.user.getAvailableMembershipPercentage.useQuery(userIdValue, {
        enabled: !!userIdValue,
    });
    const max = availableMembershipQuery.data ?? 100;

    const onSubmit = handleSubmit(async (data) => {
        await addUserToGroup(data);
        reset(defaultValues);
        props.onClose();
    });

    const onEdit = handleSubmit(async (data) => {
        if (props.type === 'edit' && data.percentage) {
            await updatePercentage({
                membershipId: props.membership.id,
                groupId: data.groupId,
                percentage: data.percentage,
            });
        }

        if (props.type === 'edit' && data.roles && props.membership.roles[0]?.name !== data.roles[0].name) {
            if (props.membership.roles[0]) {
                await removeFromMembership({ membershipId: props.membership.id, roleId: props.membership.roles[0].id });
            }
            await addToMembership({ membershipId: props.membership.id, id: data.roles[0].id, type: 'existing' });
        }
        reset(defaultValues);
        props.onClose();
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

    if (rolesValue) {
        role = rolesValue[0] ? rolesValue[0].name : undefined;
    }

    return (
        <Modal visible={props.visible} onClose={props.onClose} width={530}>
            <ModalHeader className={s.ModalHeader}>
                <Text weight="bold">{tr('Add team member')}</Text>
                <ModalCross onClick={props.onClose} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={props.type === 'edit' ? onEdit : onSubmit} className={s.Form}>
                    <FormControl label={props.type === 'team-to-user' ? tr('Team') : tr('Team member name')} required>
                        {props.type === 'team-to-user' ? (
                            <GroupComboBox
                                defaultGroupId={watch('groupId')}
                                onChange={onTeamChange}
                                error={errors.groupId}
                            />
                        ) : (
                            <UserSelect
                                readOnly={props.type === 'edit'}
                                mode="single"
                                selectedUsers={userIdValue ? [userIdValue] : undefined}
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
                            value={watch('percentage') || undefined}
                        />
                    </FormControl>

                    <FormActions>
                        <Button type="button" text={tr('Cancel')} onClick={props.onClose} />
                        <Button
                            type="submit"
                            text={props.type === 'edit' ? tr('Save') : tr('Create')}
                            view="primary"
                            size="m"
                        />
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
