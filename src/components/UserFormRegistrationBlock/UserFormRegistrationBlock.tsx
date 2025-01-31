import React from 'react';
import { FormControlInput, Switch, SwitchControl, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { OrganizationUnit, User } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';

import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { Nullish } from '../../utils/types';
import { UserSelect } from '../UserSelect/UserSelect';

import s from './UserFormRegistrationBlock.module.css';
import { tr } from './UserFormRegistrationBlock.i18n';

interface UserFormRegistrationBlockProps {
    className: string;
    id: string;
    type: 'internal' | 'existing' | 'toDecree' | 'fromDecree';
    organizationUnits?: OrganizationUnit[];
    onOrganistaionUnitChange?: (orgId: string) => void;
    onSupplementalOrganistaionUnitChange?: (orgId: string) => void;
    onFiredOrganizationUnitChange?: (orgId: string) => void;
    readOnly?: boolean;
    edit?: boolean;
}

interface UserFormRegistrationBlockType {
    organizationUnitId: string;
    percentage: number;
    supplementalPositions?: Array<{ organizationUnitId: string; percentage: number; startDate: Date; unitId?: string }>;
    firedOrganizationUnitId?: string;
    unitId?: string;
    date: Date;
    creationCause: string;
    recruiterId?: string;
    osPreference?: string;
}

export const UserFormRegistrationBlock = ({
    className,
    id,
    type,
    readOnly,
    edit,
    organizationUnits,
    onOrganistaionUnitChange,
    onFiredOrganizationUnitChange,
}: UserFormRegistrationBlockProps) => {
    const {
        register,
        setValue,
        setError,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormRegistrationBlockType>();

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue('organizationUnitId', o.id);
            trigger('organizationUnitId');
            onOrganistaionUnitChange?.(o.id);
        }
    };

    const onFiredOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue('firedOrganizationUnitId', o.id);
            onFiredOrganizationUnitChange?.(o.id);
        }
        trigger('firedOrganizationUnitId');
    };

    const onPercentageChange = (
        percentage: number,
        percentageType: 'percentage' | 'supplementalPositions.0.percentage',
    ) => {
        if (percentage > 1 || percentage < 0.01) {
            setError(percentageType, { message: tr('Please enter percentage from 0.01 to 1') });
        }
        trigger(percentageType);
    };

    const onUserChange = (user: Nullish<User>, userType: keyof UserFormRegistrationBlockType) => {
        user && setValue(userType, user.id);
        trigger(userType);
    };

    const unitId = watch('unitId');
    const selectedReqruiterId = watch('recruiterId');

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Registration')}
            </Text>

            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Organization')} required>
                    <OrganizationUnitComboBox
                        readOnly={readOnly}
                        searchType="internal"
                        organizationUnitId={watch('organizationUnitId')}
                        onChange={onOrganizationChange}
                        error={errors.organizationUnitId}
                        items={organizationUnits}
                    />
                </FormControl>
                <FormControl label={tr('Unit ID')} error={errors.unitId}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write unit ID')}
                        value={readOnly && !unitId ? tr('Not specified') : unitId}
                        outline
                        {...register('unitId')}
                    />
                </FormControl>
                <FormControl label={tr('Percentage')} error={errors.percentage}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write the percentage')}
                        outline
                        type="number"
                        value={readOnly && !watch('percentage') ? tr('Not specified') : watch('percentage')}
                        {...register('percentage', {
                            valueAsNumber: true,
                            onChange: (e) => onPercentageChange(+e.target.value, 'percentage'),
                        })}
                        step={0.01}
                    />
                </FormControl>
                <FormControl required label={tr('Start date')} error={errors.date}>
                    <FormControlInput
                        readOnly={readOnly}
                        outline
                        autoComplete="off"
                        size="m"
                        type="date"
                        value={
                            (edit || readOnly) && watch('date')
                                ? watch('date').toISOString().substring(0, 10)
                                : undefined
                        }
                        {...register('date', { valueAsDate: true })}
                    />
                </FormControl>

                {nullable(type === 'internal', () => (
                    <FormControl label={tr('Recruiter')}>
                        <UserSelect
                            readOnly={readOnly}
                            mode="single"
                            selectedUsers={selectedReqruiterId ? [selectedReqruiterId] : undefined}
                            onChange={(users) => onUserChange(users[0], 'recruiterId')}
                            onReset={() => setValue('recruiterId', undefined)}
                        />
                    </FormControl>
                ))}
                {nullable(type === 'internal', () => (
                    <FormControl label={tr('Cause')} required error={errors.creationCause}>
                        <Switch
                            className={s.Switch}
                            value={watch('creationCause')}
                            onChange={(_e, a) => setValue('creationCause', a)}
                        >
                            <SwitchControl disabled={readOnly} size="m" text={tr('Start')} value="start" />
                            <SwitchControl disabled={readOnly} size="m" text={tr('Transfer')} value="transfer" />
                        </Switch>
                    </FormControl>
                ))}
                {nullable(type === 'existing', () => (
                    <FormControl label={tr('OS preference')} error={errors.osPreference} required>
                        <FormControlInput
                            autoComplete="off"
                            size="m"
                            placeholder={tr('Enter OS name')}
                            outline
                            {...register('osPreference')}
                        />
                    </FormControl>
                ))}
                {nullable(type === 'toDecree', () => (
                    <FormControl label={tr('Dismissal from the organization')}>
                        <OrganizationUnitComboBox
                            searchType="internal"
                            organizationUnitId={watch('firedOrganizationUnitId')}
                            onChange={onFiredOrganizationChange}
                            error={errors.firedOrganizationUnitId}
                            items={organizationUnits}
                        />
                    </FormControl>
                ))}
            </div>

            <div className={s.AddSupplementalPosition}></div>
            <AddSupplementalPosition readOnly={readOnly} />
        </div>
    );
};
