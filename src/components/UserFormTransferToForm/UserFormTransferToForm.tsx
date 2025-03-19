import React from 'react';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Group, OrganizationUnit, Role, User } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { Nullish } from '../../utils/types';
import { UserSelect } from '../UserSelect/UserSelect';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { RoleSelect } from '../RoleSelect/RoleSelect';

import s from './UserFormTransferToForm.module.css';
import { tr } from './UserFormTransferToForm.i18n';

interface UserFormTransferToFormProps {
    className: string;
    id: string;
    excludedUsers?: string[];
    organizationUnits?: OrganizationUnit[];
    onOrganistaionUnitChange?: (orgId: string) => void;
    readOnly?: boolean;
    edit?: boolean;
}

interface UserFormTransferToFormType {
    transferToOrganizationUnitId: string;
    transferToTitle?: string;
    transferToGroupId?: string;
    transferToDate: Date;
    transferToSupervisorId?: string;
    transferToSupplementalPositions?: Array<{
        organizationUnitId: string;
        percentage: number;
        workStartDate: Date;
        unitId?: string;
    }>;
}

export const UserFormTransferToForm = ({
    className,
    id,
    readOnly,
    edit,
    organizationUnits,
    onOrganistaionUnitChange,
    excludedUsers,
}: UserFormTransferToFormProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormTransferToFormType>();

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue('transferToOrganizationUnitId', o.id);
            trigger('transferToOrganizationUnitId');
            onOrganistaionUnitChange?.(o.id);
        }
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('transferToGroupId', group.id);
        trigger('transferToGroupId');
    };

    const onUserChange = (user: Nullish<User>, userType: keyof UserFormTransferToFormType) => {
        user && setValue(userType, user.id);
        trigger(userType);
    };
    const onRoleChange = (r: Nullish<Role>) => {
        r && setValue('transferToTitle', r.name);
        trigger('transferToTitle');
    };
    const transferToSupervisorId = watch('transferToSupervisorId');

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Transfer')}
            </Text>

            <div className={s.TwoInputsRow}>
                <FormControl label={tr('New organization')} required>
                    <OrganizationUnitComboBox
                        readOnly={readOnly}
                        searchType="internal"
                        organizationUnitId={watch('transferToOrganizationUnitId')}
                        onChange={onOrganizationChange}
                        error={errors.transferToOrganizationUnitId}
                        items={organizationUnits}
                    />
                </FormControl>
                <FormControl label={tr('New orgGroup')}>
                    <GroupComboBox
                        readOnly={readOnly}
                        defaultGroupId={watch('transferToGroupId')}
                        onChange={onTeamChange}
                        error={errors.transferToGroupId}
                        organizational
                        onReset={() => setValue('transferToGroupId', undefined)}
                    />
                </FormControl>
                <FormControl label={tr('New role')}>
                    <RoleSelect
                        readOnly={readOnly}
                        onChange={onRoleChange}
                        roleName={watch('transferToTitle')}
                        error={errors.transferToTitle}
                    />
                </FormControl>
                <FormControl label={tr('New supervisor')}>
                    <UserSelect
                        excludedUsers={excludedUsers}
                        readOnly={readOnly}
                        mode="single"
                        selectedUsers={transferToSupervisorId ? [transferToSupervisorId] : undefined}
                        onChange={(users) => onUserChange(users[0], 'transferToSupervisorId')}
                        error={errors.transferToSupervisorId}
                    />
                </FormControl>
                <FormControl required label={tr('Start date')} error={errors.transferToDate}>
                    <FormControlInput
                        readOnly={readOnly}
                        outline
                        autoComplete="off"
                        size="m"
                        type="date"
                        value={
                            (edit || readOnly) && watch('transferToDate')
                                ? watch('transferToDate').toISOString().substring(0, 10)
                                : undefined
                        }
                        {...register('transferToDate', { valueAsDate: true })}
                    />
                </FormControl>
            </div>

            <div className={s.AddSupplementalPosition}></div>
            <AddSupplementalPosition readOnly={readOnly} transfer />
        </div>
    );
};
