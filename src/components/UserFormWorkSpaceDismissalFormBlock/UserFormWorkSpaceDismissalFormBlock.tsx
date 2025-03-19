import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';

import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { UserFormAttaches } from '../UserFormAttaches/UserFormAttaches';

import s from './UserFormWorkSpaceDismissalFormBlock.module.css';
import { tr } from './UserFormWorkSpaceDismissalFormBlock.i18n';

interface UserFormWorkSpaceDismissalFormBlockProps {
    className: string;
    id: string;
    type?: 'new' | 'readOnly' | 'edit';
    requestId?: string;
    requestType: 'dismiss' | 'transfer' | 'transferInternToStaff';
}

interface UserFormWorkSpaceDismissalFormBlockType {
    workMode: string;
    workSpace?: string;
    location: string;
    applicationForReturnOfEquipment?: string;
    attachIds: string[];
}

export const UserFormWorkSpaceDismissalFormBlock = ({
    className,
    id,
    type,
    requestId,
    requestType,
}: UserFormWorkSpaceDismissalFormBlockProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormWorkSpaceDismissalFormBlockType>();

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    const devicesReturnAppLabel =
        requestType === 'transferInternToStaff'
            ? tr('Devices return/moving application')
            : tr('Devices return application');

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Work space')}
            </Text>

            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Work mode')} required>
                    <WorkModeCombobox
                        readOnly={type === 'readOnly'}
                        onChange={onWorkModeChange}
                        value={watch('workMode')}
                        error={errors.workMode}
                    />
                </FormControl>
                <FormControl label={tr('Location')} required error={errors.location}>
                    <FormControlInput
                        readOnly={type === 'readOnly'}
                        autoComplete="off"
                        size="m"
                        outline
                        placeholder={tr('Write the location name')}
                        {...register('location', { required: tr('Required field') })}
                    />
                </FormControl>
                <FormControl label={tr('Work space')} error={errors.workSpace}>
                    <FormControlInput
                        readOnly={type === 'readOnly'}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Workspace № in format 6.01.195')}
                        outline
                        {...register('workSpace')}
                    />
                </FormControl>
                <FormControl label={devicesReturnAppLabel} error={errors.applicationForReturnOfEquipment}>
                    <FormControlInput
                        readOnly={type === 'readOnly'}
                        autoComplete="off"
                        size="m"
                        outline
                        placeholder={tr('Application №')}
                        {...register('applicationForReturnOfEquipment')}
                    />
                </FormControl>
            </div>
            <UserFormAttaches requestId={requestId} requestType={requestType} type={type} />
        </div>
    );
};
