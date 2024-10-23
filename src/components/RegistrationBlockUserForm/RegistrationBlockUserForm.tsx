import React from 'react';
import { FormControlInput, Switch, SwitchControl, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { OrganizationUnit, User } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { Nullish } from '../../utils/types';
import { UserSelect } from '../UserSelect/UserSelect';
import { CreateUserCreationRequestInternalEmployee } from '../../modules/userCreationRequestSchemas';

import s from './RegistrationBlockUserForm.module.css';
import { tr } from './RegistrationBlockUserForm.i18n';

interface RegistrationBlockUserFormProps {
    className: string;
    id: string;
}

export const RegistrationBlockUserForm = ({ className, id }: RegistrationBlockUserFormProps) => {
    const {
        register,
        setValue,
        setError,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext();

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        o && setValue('organizationUnitId', o.id);
        trigger('organizationUnitId');
    };
    const onPercentageChange = (percentage: number, type: 'percentage' | 'supplementalPositions.0.percentage') => {
        if (percentage > 1 || percentage < 0.01) {
            setError(type, { message: tr('Please enter percentage from 0.01 to 1') });
        }
        trigger(type);
    };

    const onUserChange = (user: Nullish<User>, type: keyof CreateUserCreationRequestInternalEmployee) => {
        user && setValue(type, user.id);
        trigger(type);
    };
    console.log(watch('date'));

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Registration')}
            </Text>
            <div className={s.OrganizationCombobox}>
                <FormControl label={tr('Organization')} required>
                    <OrganizationUnitComboBox
                        searchType="internal"
                        organizationUnitId={watch('organizationUnitId')}
                        onChange={onOrganizationChange}
                        error={errors.organizationUnitId}
                    />
                </FormControl>
            </div>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Unit ID')} error={errors.unitId}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write unit ID')}
                        outline
                        {...register('unitId')}
                    />
                </FormControl>
                <FormControl label={tr('Percentage')} error={errors.percentage}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write the percentage')}
                        outline
                        type="number"
                        value={watch('percentage')}
                        {...register('percentage', {
                            valueAsNumber: true,
                            onChange: (e) => onPercentageChange(+e.target.value, 'percentage'),
                        })}
                        step={0.01}
                    />
                </FormControl>
                <FormControl required label={tr('Start date')} error={errors.date}>
                    <FormControlInput
                        outline
                        autoComplete="off"
                        size="m"
                        type="date"
                        {...register('date', { valueAsDate: true })}
                    />
                </FormControl>

                <FormControl label={tr('Cause')} required error={errors.creationCause}>
                    <Switch
                        className={s.Switch}
                        value={watch('creationCause')}
                        onChange={(_e, a) => setValue('creationCause', a)}
                    >
                        <SwitchControl size="m" text={tr('Start')} value="start" />
                        <SwitchControl size="m" text={tr('Transfer')} value="transfer" />
                    </Switch>
                </FormControl>
            </div>

            <FormControl label={tr('Recruiter')}>
                <UserSelect
                    mode="single"
                    selectedUsers={watch('recruiterId') ? [watch('recruiterId')] : undefined}
                    onChange={(users) => onUserChange(users[0], 'recruiterId')}
                    onReset={() => setValue('recruiterId', undefined)}
                />
            </FormControl>
            <div className={s.AddSupplementalPosition}></div>
            <AddSupplementalPosition
                onOrganizatioUnitChange={(orgId) =>
                    orgId && setValue('supplementalPositions.0.organizationUnitId', orgId)
                }
                organizationUnitId={watch('supplementalPositions.0.organizationUnitId')}
                percentage={watch('supplementalPositions.0.percentage')}
                setPercentage={(percentage) => {
                    percentage && setValue('supplementalPositions.0.percentage', percentage);
                    percentage && onPercentageChange(percentage, 'supplementalPositions.0.percentage');
                }}
                onClose={() => {
                    setValue('supplementalPositions', undefined);
                    trigger('supplementalPositions');
                }}
                unitId={watch('supplementalPositions.0.unitId')}
                setUnitId={(unitId) => unitId && setValue('supplementalPositions.0.unitId', unitId)}
                errors={errors.supplementalPositions instanceof Array && errors.supplementalPositions[0]}
            />
        </div>
    );
};
