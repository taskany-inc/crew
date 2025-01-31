import { nullable } from '@taskany/bricks';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { IconBinOutline, IconPlusCircleOutline } from '@taskany/icons';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { FormControl } from '../FormControl/FormControl';
import { errorPicker } from '../../utils/errorPicker';

import s from './AddSupplementalPosition.module.css';
import { tr } from './AddSupplementalPosition.i18n';

interface Position {
    organizationUnitId: string;
    percentage: number;
    unitId?: string;
    workStartDate: Date | null;
}

interface SupplementalPositionsType {
    supplementalPositions?: Array<Position>;
}

interface AddSupplementalPositionProps {
    readOnly?: boolean;
}

export const AddSupplementalPosition = ({ readOnly }: AddSupplementalPositionProps) => {
    const {
        register,
        setValue,
        control,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<SupplementalPositionsType>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'supplementalPositions',
        rules: { maxLength: 1 },
    });

    return (
        <div className={s.Base}>
            {fields.map((field, index) => {
                const workStartDate = watch(`supplementalPositions.${index}.workStartDate`);
                return (
                    <div key={field.id}>
                        <div className={s.Header}>
                            <Text as="h3">{tr('Supplemental position')}</Text>

                            {nullable(!readOnly, () => (
                                <AddInlineTrigger
                                    text={tr('Remove supplemental position')}
                                    icon={<IconBinOutline size="s" />}
                                    onClick={() => remove(index)}
                                />
                            ))}
                        </div>
                        <div className={s.TwoInputsRow}>
                            <FormControl label={tr('Supplemental organization')} required>
                                <OrganizationUnitComboBox
                                    readOnly={readOnly}
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
                                    {...register(`supplementalPositions.${index}.percentage`, {
                                        valueAsNumber: true,
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
                            <FormControl
                                required
                                label={tr('Start date')}
                                error={errorPicker<Position>(errors.supplementalPositions, index, 'workStartDate')}
                            >
                                <FormControlInput
                                    readOnly={readOnly}
                                    outline
                                    autoComplete="off"
                                    size="m"
                                    type="date"
                                    value={
                                        workStartDate && JSON.stringify(workStartDate) !== 'null'
                                            ? workStartDate.toISOString().substring(0, 10)
                                            : undefined
                                    }
                                    {...register(`supplementalPositions.${index}.workStartDate`, {
                                        valueAsDate: true,
                                        onChange: () => trigger('supplementalPositions'),
                                    })}
                                />
                            </FormControl>
                        </div>
                    </div>
                );
            })}
            <div className={s.InlineTrigger}>
                {nullable(!readOnly && fields.length === 0, () => (
                    <AddInlineTrigger
                        text={tr('Add supplemental position')}
                        icon={<IconPlusCircleOutline size="s" className={s.Icon} />}
                        onClick={() =>
                            append({ organizationUnitId: '', percentage: 0.01, workStartDate: null, unitId: '' })
                        }
                    />
                ))}
            </div>
        </div>
    );
};
