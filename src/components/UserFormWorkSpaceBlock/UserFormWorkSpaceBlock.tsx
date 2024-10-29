import React from 'react';
import { FormControlEditor, FormControlInput, Text } from '@taskany/bricks/harmony';
import { Controller, useFormContext } from 'react-hook-form';
import { nullable, useCopyToClipboard } from '@taskany/bricks';

import { notifyPromise } from '../../utils/notifications/notifyPromise';
import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';

import s from './UserFormWorkSpaceBlock.module.css';
import { tr } from './UserFormWorkSpaceBlock.i18n';

interface UserFormWorkSpaceBlockProps {
    className: string;
    id: string;
    readOnly?: boolean;
    type?: 'dismissal' | 'employment';
}

interface UserFormWorkSpaceBlockType {
    workMode: string;
    equipment: string;
    extraEquipment?: string;
    workSpace?: string;
    location: string;
    workModeComment?: string;
}

export const UserFormWorkSpaceBlock = ({
    className,
    id,
    readOnly,
    type = 'employment',
}: UserFormWorkSpaceBlockProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        control,
        formState: { errors },
    } = useFormContext<UserFormWorkSpaceBlockType>();

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    const extraEquipment = watch('extraEquipment');
    const equipment = watch('equipment');
    const [, copy] = useCopyToClipboard();

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Work space')}
            </Text>
            <div onClick={() => readOnly && equipment && notifyPromise(copy(equipment), 'copy')}>
                <Controller
                    name="equipment"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            label={type === 'employment' ? tr('Required euipment') : tr('Equipment')}
                            required
                            error={errors.equipment}
                        >
                            <FormControlEditor
                                disabled={readOnly}
                                className={s.FormEditor}
                                outline
                                disableAttaches
                                placeholder={tr('Write equipment list')}
                                {...field}
                                value={readOnly && !equipment ? tr('Not specified') : equipment}
                            />
                        </FormControl>
                    )}
                />
            </div>

            <div onClick={() => readOnly && extraEquipment && notifyPromise(copy(extraEquipment), 'copy')}>
                <Controller
                    name="extraEquipment"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            label={type === 'employment' ? tr('Extra equipment') : tr('Test devices')}
                            error={errors.extraEquipment}
                        >
                            <FormControlEditor
                                disabled={readOnly}
                                className={s.FormEditor}
                                outline
                                disableAttaches
                                placeholder={tr('Write equipment list')}
                                {...field}
                                value={readOnly && !extraEquipment ? tr('Not specified') : extraEquipment}
                            />
                        </FormControl>
                    )}
                />
            </div>
            <div className={s.TwoInputsRow}>
                {nullable(type === 'employment', () => (
                    <FormControl label={tr('Work space application')} error={errors.workSpace}>
                        <FormControlInput
                            readOnly={readOnly}
                            autoComplete="off"
                            size="m"
                            placeholder={tr('Write the application text')}
                            value={readOnly && !watch('workSpace') ? tr('Not specified') : undefined}
                            outline
                            {...register('workSpace')}
                        />
                    </FormControl>
                ))}

                <FormControl label={tr('Location')} required error={errors.location}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        outline
                        placeholder={tr('Write the location name')}
                        {...register('location', { required: tr('Required field') })}
                    />
                </FormControl>
                <FormControl label={tr('Work mode')} required>
                    <WorkModeCombobox
                        readOnly={readOnly}
                        onChange={onWorkModeChange}
                        value={watch('workMode')}
                        error={errors.workMode}
                    />
                </FormControl>

                {nullable(type === 'employment', () => (
                    <FormControl label={tr('Work mode comment')} error={errors.workModeComment}>
                        <FormControlInput
                            readOnly={readOnly}
                            autoComplete="off"
                            size="m"
                            outline
                            value={readOnly && !watch('workModeComment') ? tr('Not specified') : undefined}
                            placeholder={tr('Write work mode comment')}
                            {...register('workModeComment')}
                        />
                    </FormControl>
                ))}
            </div>
        </div>
    );
};
