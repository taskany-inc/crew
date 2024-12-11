import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { nullable } from '@taskany/bricks';
import { IconBinOutline } from '@taskany/icons';

import { FormControl } from '../FormControl/FormControl';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';

import { tr } from './UserFormDevicesBlock.i18n';
import s from './UserFormDevicesBlock.module.css';

interface UserFormDevicesBlockProps {
    className: string;
    readOnly?: boolean;
}

export const UserFormDevicesBlock = ({ className, readOnly }: UserFormDevicesBlockProps) => {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<{
        devices: Array<{ name: string; id: string }>;
        testingDevices: Array<{ name: string; id: string }>;
    }>();

    const {
        fields: deviceFields,
        append: deviceAppend,
        remove: deviceRemove,
    } = useFieldArray({
        control,
        name: 'devices',
        rules: { minLength: 1 },
    });

    const {
        fields: testingDeviceFields,
        append: testingDeviceAppend,
        remove: testingDeviceRemove,
    } = useFieldArray({
        control,
        name: 'testingDevices',
    });

    return (
        <div className={className}>
            <Text as="h3">
                {tr('Devices')}{' '}
                <Text as="span" className={s.Required}>
                    *
                </Text>
            </Text>
            {deviceFields.map((field, index) => (
                <div key={field.id} className={s.TwoInputsWithBin}>
                    <FormControl
                        label={tr('Name')}
                        error={errors?.devices instanceof Array && errors?.devices[index].name}
                    >
                        <FormControlInput
                            readOnly={readOnly}
                            placeholder={tr('For example smart speaker')}
                            outline
                            autoComplete="off"
                            size="m"
                            {...register(`devices.${index}.name`)}
                        />
                    </FormControl>
                    <FormControl label={tr('ID')} error={errors?.devices instanceof Array && errors?.devices[index].id}>
                        <FormControlInput
                            readOnly={readOnly}
                            placeholder="123456789"
                            outline
                            autoComplete="off"
                            size="m"
                            {...register(`devices.${index}.id`)}
                        />
                    </FormControl>
                    {nullable(index !== 0 && !readOnly, () => (
                        <IconBinOutline size="s" onClick={() => deviceRemove(index)} className={s.BinIcon} />
                    ))}
                </div>
            ))}
            {nullable(!readOnly, () => (
                <AddInlineTrigger text={tr('Add device')} onClick={() => deviceAppend({ name: '', id: '' })} />
            ))}
            <Text as="h3">{tr('Test devices')}</Text>

            {testingDeviceFields.map((field, index) => (
                <div key={field.id} className={s.TwoInputsWithBin}>
                    <FormControl
                        label={tr('Name')}
                        error={errors?.testingDevices instanceof Array && errors?.testingDevices[index]?.name}
                    >
                        <FormControlInput
                            readOnly={readOnly}
                            placeholder={tr('For example smart speaker')}
                            outline
                            autoComplete="off"
                            size="m"
                            {...register(`testingDevices.${index}.name`)}
                        />
                    </FormControl>
                    <FormControl
                        label={tr('ID')}
                        error={errors?.testingDevices instanceof Array && errors?.testingDevices[index]?.id}
                    >
                        <FormControlInput
                            readOnly={readOnly}
                            placeholder="123456789"
                            outline
                            autoComplete="off"
                            size="m"
                            {...register(`testingDevices.${index}.id`)}
                        />
                    </FormControl>
                    {nullable(!readOnly, () => (
                        <IconBinOutline size="s" onClick={() => testingDeviceRemove(index)} className={s.BinIcon} />
                    ))}
                </div>
            ))}

            {nullable(!readOnly, () => (
                <AddInlineTrigger
                    text={tr('Add testing device')}
                    onClick={() => testingDeviceAppend({ name: '', id: '' })}
                />
            ))}
        </div>
    );
};
