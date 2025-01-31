import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { errorPicker } from '../../utils/errorPicker';

import { tr } from './UserFormSupplementalPositionsBlock.i18n';
import s from './UserFormSupplementalPositionsBlock.module.css';

interface Position {
    organizationUnitId: string;
    percentage: number;
    unitId?: string;
    workEndDate?: Date;
}

interface SupplementalPositionsType {
    supplementalPositions?: Array<Position>;
}

interface UserFormSupplementalPositionsBlockProps {
    id: string;
    className: string;
    readOnly?: boolean;
    edit?: boolean;
}

export const UserFormSupplementalPositionsBlock = ({
    id,
    className,
    readOnly,
    edit,
}: UserFormSupplementalPositionsBlockProps) => {
    const {
        register,
        setValue,
        control,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<SupplementalPositionsType>();

    const { fields } = useFieldArray({
        control,
        name: 'supplementalPositions',
    });

    return (
        <div id={id} className={className}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Registration')}
            </Text>
            {fields.map((field, index) => {
                const workEndDate = watch(`supplementalPositions.${index}.workEndDate`);
                return (
                    <div key={field.id}>
                        <div className={s.TwoInputsRow}>
                            <FormControl
                                label={index === 0 ? tr('Organization') : tr('Supplemental organization')}
                                required
                            >
                                <OrganizationUnitComboBox
                                    searchType="internal"
                                    onChange={(orgUnit) =>
                                        orgUnit &&
                                        setValue(`supplementalPositions.${index}.organizationUnitId`, orgUnit.id)
                                    }
                                    organizationUnitId={watch(`supplementalPositions.${index}.organizationUnitId`)}
                                    error={errorPicker<Position>(
                                        errors.supplementalPositions,
                                        index,
                                        'organizationUnitId',
                                    )}
                                    readOnly={readOnly}
                                />
                            </FormControl>
                            <FormControl
                                label={tr('Percentage')}
                                required
                                error={errorPicker<Position>(errors.supplementalPositions, index, 'percentage')}
                            >
                                <FormControlInput
                                    placeholder={tr('Write percentage from 0.01 to 1')}
                                    outline
                                    size="m"
                                    autoComplete="off"
                                    type="number"
                                    step={0.01}
                                    readOnly={readOnly}
                                    {...register(`supplementalPositions.${index}.percentage`, { valueAsNumber: true })}
                                />
                            </FormControl>
                            <FormControl
                                required={fields.length > 1 && index === 0}
                                label={tr('Dismsissal date')}
                                error={
                                    errorPicker<Position>(errors.supplementalPositions, index, 'workEndDate') ||
                                    errors?.supplementalPositions?.root
                                }
                            >
                                <FormControlInput
                                    outline
                                    autoComplete="off"
                                    size="m"
                                    type="date"
                                    readOnly={readOnly}
                                    value={
                                        workEndDate && JSON.stringify(workEndDate) !== 'null' && (edit || readOnly)
                                            ? // main supplemental position
                                              workEndDate.toISOString().substring(0, 10)
                                            : undefined
                                    }
                                    {...register(`supplementalPositions.${index}.workEndDate`, {
                                        valueAsDate: true,
                                        onChange: () => trigger('supplementalPositions'),
                                    })}
                                />
                            </FormControl>
                            <FormControl label={tr('Unit ID')}>
                                <FormControlInput
                                    outline
                                    autoComplete="off"
                                    size="m"
                                    placeholder={tr('Write unit ID')}
                                    readOnly={readOnly}
                                    {...register(`supplementalPositions.${index}.unitId`)}
                                />
                            </FormControl>
                        </div>
                        {nullable(index === 0 && fields.length > 1, () => (
                            <Text as="h3">{tr('Supplemental position')}</Text>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
