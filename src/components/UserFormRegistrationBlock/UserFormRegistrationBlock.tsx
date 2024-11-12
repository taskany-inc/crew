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
    type: 'internal' | 'existing';
    readOnly?: boolean;
    edit?: boolean;
}

interface UserFormRegistrationBlockType {
    organizationUnitId: string;
    percentage: number;
    supplementalPositions?: Array<{ organizationUnitId: string; percentage: number; unitId?: string }>;
    unitId?: string;
    date: Date;
    creationCause: string;
    recruiterId?: string;
    osPreference?: string;
}

export const UserFormRegistrationBlock = ({ className, id, type, readOnly, edit }: UserFormRegistrationBlockProps) => {
    const {
        register,
        setValue,
        setError,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormRegistrationBlockType>();

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        o && setValue('organizationUnitId', o.id);
        trigger('organizationUnitId');
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
                {nullable(
                    type === 'internal',
                    () => (
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
                    ),
                    <FormControl label={tr('OS preference')} error={errors.osPreference} required>
                        <FormControlInput
                            autoComplete="off"
                            size="m"
                            placeholder={tr('Enter OS name')}
                            outline
                            {...register('osPreference')}
                        />
                    </FormControl>,
                )}
            </div>

            <div className={s.AddSupplementalPosition}></div>
            <AddSupplementalPosition
                visible={!!watch('supplementalPositions.0.organizationUnitId')}
                readOnly={readOnly}
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
