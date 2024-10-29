import { FC, useEffect } from 'react';
import { OrganizationUnit } from 'prisma/prisma-client';
import { useFormContext } from 'react-hook-form';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { FormControl } from '../FormControl/FormControl';
import { Nullish } from '../../utils/types';

import { tr } from './UserFormPositionsBlock.i18n';
import s from './UserFormPositionsBlock.module.css';

interface UserFormPositionsBlockProps {
    className: string;
    id: string;
    organizationUnits?: OrganizationUnit[];
    onChange?: (orgId: string, index: number) => void;
}

interface UserFormPositionsBlockType {
    positions: Array<{ organizationUnitId: string; percentage: number; unitId?: string; workEndDate: Date }>;
    firedOrganizationUnitId?: string;
}

export const UserFormPositionsBlock: FC<UserFormPositionsBlockProps> = ({
    className,
    id,
    organizationUnits,
    onChange,
}) => {
    const {
        register,
        setValue,
        setError,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormPositionsBlockType>();

    const positions = watch('positions');
    const firedOrganizationUnitId = watch('firedOrganizationUnitId');

    const onOrganizationChange = (orgId: string, index: number) => {
        const key = `positions.${index}.organizationUnitId` as const;

        if (orgId) {
            setValue(
                'positions',
                positions.map((p) => {
                    if (p.organizationUnitId === orgId) {
                        p.organizationUnitId = '';
                        p.percentage = 1;
                        p.unitId = '';
                    }

                    return p;
                }),
            );
            setValue(key, orgId);
            trigger(key);

            if (firedOrganizationUnitId === orgId) {
                setValue('firedOrganizationUnitId', undefined);
                trigger('firedOrganizationUnitId');
            }
        }
        onChange?.(orgId, index);
    };

    const onFiredOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue(
                'positions',
                positions.map((p) => {
                    if (p.organizationUnitId === o.id) {
                        p.organizationUnitId = '';
                        p.unitId = '';
                        p.percentage = 1;
                    }
                    return p;
                }),
            );
            setValue('firedOrganizationUnitId', o.id);
            trigger('firedOrganizationUnitId');
        }
    };

    const onPercentageChange = (percentage: number, index: number) => {
        const key = `positions.${index}.percentage` as const;

        if (percentage > 1 || percentage < 0.01) {
            setError(key, { message: tr('Please enter percentage from 0.01 to 1') });
        }
        trigger(key);
    };

    const mainUnitId = watch('positions.0.unitId');
    const workEndDate = watch('positions.0.workEndDate') ?? new Date();
    const mainPercentage = watch('positions.0.percentage') ?? 1;

    const subUnitId = watch('positions.1.unitId');

    useEffect(() => {
        if (subUnitId) {
            setValue('positions.1.workEndDate', workEndDate);
        }
    }, [subUnitId, workEndDate]);

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Registration')}
            </Text>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Organization')} required>
                    <OrganizationUnitComboBox
                        searchType="internal"
                        organizationUnitId={watch('positions.0.organizationUnitId')}
                        onChange={(val) => val && onOrganizationChange(val.id, 0)}
                        error={errors.positions instanceof Array && errors.positions[0]?.organizationUnitId}
                        items={organizationUnits}
                    />
                </FormControl>
                <FormControl
                    label={tr('Unit ID')}
                    error={errors.positions instanceof Array && errors.positions[0]?.unitId}
                >
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write unit ID')}
                        value={mainUnitId}
                        outline
                        {...register('positions.0.unitId')}
                    />
                </FormControl>
                <FormControl
                    label={tr('Decree start date')}
                    error={errors.positions instanceof Array && errors.positions[0]?.workEndDate}
                    required
                >
                    <FormControlInput
                        outline
                        autoComplete="off"
                        size="m"
                        type="date"
                        value={workEndDate.toISOString()?.substring(0, 10)}
                        {...register('positions.0.workEndDate', { valueAsDate: true })}
                    />
                </FormControl>

                <FormControl
                    label={tr('Percentage')}
                    error={errors.positions instanceof Array && errors.positions[0]?.percentage}
                >
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write the percentage')}
                        outline
                        type="number"
                        value={mainPercentage}
                        {...register('positions.0.percentage', {
                            valueAsNumber: true,
                            onChange: (e) => onPercentageChange(+e.target.value, 0),
                        })}
                        step={0.01}
                    />
                </FormControl>
            </div>
            {nullable(organizationUnits, () => (
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

            <AddSupplementalPosition
                onOrganizatioUnitChange={(orgId) => orgId && onOrganizationChange(orgId, 1)}
                organizationUnits={organizationUnits}
                organizationUnitId={watch('positions.1.organizationUnitId')}
                percentage={watch('positions.1.percentage')}
                setPercentage={(percentage) => {
                    percentage && setValue('positions.1.percentage', percentage);
                    percentage && onPercentageChange(percentage, 1);
                }}
                onClose={() => {
                    setValue('positions', []);
                    trigger('positions');
                }}
                unitId={watch('positions.1.unitId')}
                setUnitId={(unitId) => unitId && setValue('positions.1.unitId', unitId)}
                errors={errors.positions instanceof Array && errors.positions[1]}
            />
        </div>
    );
};
