import React from 'react';
import { FormControlEditor, FormControlInput, Text } from '@taskany/bricks/harmony';
import { Controller, useFormContext } from 'react-hook-form';

import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';

import s from './UserFormWorkSpaceBlock.module.css';
import { tr } from './UserFormWorkSpaceBlock.i18n';

interface UserFormWorkSpaceBlockProps {
    className: string;
    id: string;
}

interface UserFormWorkSpaceBlockType {
    workMode: string;
    equipment: string;
    extraEquipment?: string;
    workSpace?: string;
    location: string;
    workModeComment?: string;
}

export const UserFormWorkSpaceBlock = ({ className, id }: UserFormWorkSpaceBlockProps) => {
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

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Work space')}
            </Text>
            <Controller
                name="equipment"
                control={control}
                render={({ field }) => (
                    <FormControl label={tr('Equipment')} required error={errors.equipment}>
                        <FormControlEditor
                            className={s.FormEditor}
                            outline
                            disableAttaches
                            placeholder={tr('Write equipment list')}
                            {...field}
                        />
                    </FormControl>
                )}
            />

            <Controller
                name="extraEquipment"
                control={control}
                render={({ field }) => (
                    <FormControl label={tr('Extra equipment')} error={errors.extraEquipment}>
                        <FormControlEditor
                            className={s.FormEditor}
                            outline
                            disableAttaches
                            placeholder={tr('Write equipment list')}
                            {...field}
                        />
                    </FormControl>
                )}
            />
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Work space application')} error={errors.workSpace}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write the application text')}
                        outline
                        {...register('workSpace')}
                    />
                </FormControl>
                <FormControl label={tr('Location')} required error={errors.location}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        outline
                        placeholder={tr('Write the location name')}
                        {...register('location', { required: tr('Required field') })}
                    />
                </FormControl>
                <FormControl label={tr('Work mode')} required>
                    <WorkModeCombobox onChange={onWorkModeChange} value={watch('workMode')} error={errors.workMode} />
                </FormControl>

                <FormControl label={tr('Work mode comment')} error={errors.workModeComment}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        outline
                        placeholder={tr('Write work mode comment')}
                        {...register('workModeComment')}
                    />
                </FormControl>
            </div>
        </div>
    );
};
