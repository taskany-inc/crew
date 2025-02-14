import React from 'react';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { OrganizationUnit } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { Nullish } from '../../utils/types';

import s from './UserFormNewOrganizationTransfer.module.css';
import { tr } from './UserFormNewOrganizationTransfer.i18n';

interface UserFormNewOrganizationTransferProps {
    className: string;
    id: string;
    readOnly?: boolean;
}

interface UserFormNewOrganizationTransferType {
    newOrganizationUnitId: string;
    newOrganizationRole?: string;
    newTeamLead?: string;
    newOrganizationalGroup?: string;
}

export const UserFormNewOrganizationTransfer = ({ className, id, readOnly }: UserFormNewOrganizationTransferProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormNewOrganizationTransferType>();

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue('newOrganizationUnitId', o.id);
            trigger('newOrganizationUnitId');
        }
    };

    const newOrganizationRole = watch('newOrganizationRole');
    const newTeamLead = watch('newTeamLead');
    const newOrganizationalGroup = watch('newOrganizationalGroup');

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Transfer')}
            </Text>

            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Organization')} required>
                    <OrganizationUnitComboBox
                        readOnly={readOnly}
                        searchType="internal"
                        organizationUnitId={watch('newOrganizationUnitId')}
                        onChange={onOrganizationChange}
                        error={errors.newOrganizationUnitId}
                    />
                </FormControl>
                <FormControl label={tr('New role')} error={errors.newOrganizationRole}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write new role')}
                        value={readOnly && !newOrganizationRole ? tr('Not specified') : newOrganizationRole}
                        outline
                        {...register('newOrganizationRole')}
                    />
                </FormControl>
                <FormControl label={tr('New organizational group')} error={errors.newOrganizationalGroup}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write new organizational group name')}
                        value={readOnly && !newOrganizationalGroup ? tr('Not specified') : newOrganizationalGroup}
                        outline
                        {...register('newOrganizationalGroup')}
                    />
                </FormControl>
                <FormControl label={tr('New supervisor')} error={errors.newTeamLead}>
                    <FormControlInput
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write new supervisor full name')}
                        value={readOnly && !newTeamLead ? tr('Not specified') : newTeamLead}
                        outline
                        {...register('newTeamLead')}
                    />
                </FormControl>
            </div>
        </div>
    );
};
