import React from 'react';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';

import { FormControl } from '../FormControl/FormControl';
import { PermissionServiceSelect } from '../PermissionServiceSelect/PermissionServiceSelect';

import s from './UserFormExternaExtraInfoBlock.module.css';
import { tr } from './UserFormExternaExtraInfoBlock.i18n';

interface UserFormExternaExtraInfoBlockProps {
    className: string;
    id: string;
}

export const UserFormExternaExtraInfoBlock = ({ className, id }: UserFormExternaExtraInfoBlockProps) => {
    const {
        setValue,
        watch,
        register,
        trigger,
        formState: { errors },
    } = useFormContext<{
        permissionToServices: string[];
        reason: string;
    }>();

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Extra information')}
            </Text>

            <FormControl label={tr('Permission to services')} required>
                <PermissionServiceSelect
                    selectedServices={watch('permissionToServices')}
                    className={s.PermissionServiceSelect}
                    mode="multiple"
                    onChange={(services) => {
                        setValue(
                            'permissionToServices',
                            services.map((service) => service.id),
                        );
                        trigger('permissionToServices');
                    }}
                    error={errors.permissionToServices}
                />
            </FormControl>

            <FormControl label={tr('Reason for granting permission')} error={errors.reason} required>
                <FormControlInput
                    autoComplete="off"
                    size="m"
                    placeholder={tr('Write reason')}
                    outline
                    {...register('reason', {
                        required: tr('Required field'),
                    })}
                />
            </FormControl>
        </div>
    );
};
