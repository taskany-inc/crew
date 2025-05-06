import React from 'react';
import { FormControlEditor, FormControlInput, Text } from '@taskany/bricks/harmony';
import { Controller, useFormContext } from 'react-hook-form';
import { nullable, useCopyToClipboard } from '@taskany/bricks';

import { notifyPromise } from '../../utils/notifications/notifyPromise';
import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';
import { UserFormAttaches } from '../UserFormAttaches/UserFormAttaches';

import s from './UserFormWorkSpaceBlock.module.css';
import { tr } from './UserFormWorkSpaceBlock.i18n';

interface UserFormWorkSpaceBlockProps {
    className: string;
    id: string;
    type: 'new' | 'edit' | 'readOnly';
    requestType?: UserCreationRequestType;
    requestId?: string;
    status?: string;
}

interface UserFormWorkSpaceBlockType {
    workMode: string;
    equipment: string;
    extraEquipment?: string;
    workSpace?: string;
    location: string;
    workModeComment?: string;
    applicationForReturnOfEquipment?: string;
}

export const UserFormWorkSpaceBlock = ({
    className,
    id,
    type,
    requestType = UserCreationRequestType.internalEmployee,
    requestId,
    status,
}: UserFormWorkSpaceBlockProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        control,
        formState: { errors },
    } = useFormContext<UserFormWorkSpaceBlockType>();

    const isRequiredField = status !== 'Draft' && requestType !== UserCreationRequestType.createSuppementalPosition;

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    const extraEquipment = watch('extraEquipment');
    const equipment = watch('equipment');
    const [, copy] = useCopyToClipboard();

    const isEmploymentRequest =
        requestType === UserCreationRequestType.existing ||
        requestType === UserCreationRequestType.internalEmployee ||
        requestType === UserCreationRequestType.externalEmployee ||
        requestType === UserCreationRequestType.externalFromMainOrgEmployee ||
        requestType === UserCreationRequestType.fromDecree;

    let workSpaceLabel = tr('Work space application');

    if (requestType === UserCreationRequestType.transferInside) workSpaceLabel = tr('Work space');

    let workSpacePlaceholder = tr('Write work mode comment');

    if (requestType === UserCreationRequestType.transferInside) {
        workSpacePlaceholder = tr('Workspace № in format 6.01.195');
    }

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Work space')}
            </Text>
            <div onClick={() => type === 'readOnly' && equipment && notifyPromise(copy(equipment), 'copy')}>
                <Controller
                    name="equipment"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            label={isEmploymentRequest ? tr('Required euipment') : tr('Equipment')}
                            required={isRequiredField}
                            error={errors.equipment}
                        >
                            <FormControlEditor
                                disabled={type === 'readOnly'}
                                className={s.FormEditor}
                                outline
                                disableAttaches
                                placeholder={tr('Write equipment list')}
                                {...field}
                                value={type === 'readOnly' && !equipment ? tr('Not specified') : equipment}
                            />
                        </FormControl>
                    )}
                />
            </div>

            <div onClick={() => type === 'readOnly' && extraEquipment && notifyPromise(copy(extraEquipment), 'copy')}>
                <Controller
                    name="extraEquipment"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            label={isEmploymentRequest ? tr('Extra equipment') : tr('Test devices')}
                            error={errors.extraEquipment}
                        >
                            <FormControlEditor
                                disabled={type === 'readOnly'}
                                className={s.FormEditor}
                                outline
                                disableAttaches
                                placeholder={tr('Write equipment list')}
                                {...field}
                                value={type === 'readOnly' && !extraEquipment ? tr('Not specified') : extraEquipment}
                            />
                        </FormControl>
                    )}
                />
            </div>
            <div className={requestType === UserCreationRequestType.transferInside ? s.ThreeInputsRow : s.TwoInputsRow}>
                {nullable(isEmploymentRequest || requestType === UserCreationRequestType.transferInside, () => (
                    <FormControl label={workSpaceLabel} error={errors.workSpace}>
                        <FormControlInput
                            readOnly={type === 'readOnly'}
                            autoComplete="off"
                            size="m"
                            placeholder={workSpacePlaceholder}
                            value={type === 'readOnly' && !watch('workSpace') ? tr('Not specified') : undefined}
                            outline
                            {...register('workSpace')}
                        />
                    </FormControl>
                ))}

                {nullable(UserCreationRequestType.toDecree, () => (
                    <FormControl
                        label={tr('Application for return of equipment')}
                        error={errors.applicationForReturnOfEquipment}
                    >
                        <FormControlInput
                            readOnly={type === 'readOnly'}
                            autoComplete="off"
                            size="m"
                            outline
                            placeholder={tr('Application №')}
                            {...register('applicationForReturnOfEquipment')}
                        />
                    </FormControl>
                ))}

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
                <FormControl label={tr('Work mode')} required={isRequiredField}>
                    <WorkModeCombobox
                        readOnly={type === 'readOnly'}
                        onChange={onWorkModeChange}
                        value={watch('workMode')}
                        error={errors.workMode}
                    />
                </FormControl>

                {nullable(isEmploymentRequest, () => (
                    <FormControl label={tr('Work mode comment')} error={errors.workModeComment}>
                        <FormControlInput
                            readOnly={type === 'readOnly'}
                            autoComplete="off"
                            size="m"
                            outline
                            value={type === 'readOnly' && !watch('workModeComment') ? tr('Not specified') : undefined}
                            placeholder={tr('Write work mode comment')}
                            {...register('workModeComment')}
                        />
                    </FormControl>
                ))}
            </div>
            {nullable(requestType === UserCreationRequestType.transferInside, () => (
                <UserFormAttaches
                    requestId={requestId}
                    requestType={UserCreationRequestType.transferInside}
                    type={type}
                />
            ))}
        </div>
    );
};
