import React, { useCallback } from 'react';
import { FormControlFileUpload, FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { nullable } from '@taskany/bricks';

import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { getFileIdFromPath } from '../../utils/attachFormatter';
import { pages } from '../../hooks/useRouter';
import { AttachList } from '../AttachList/AttachList';
import { trpc } from '../../trpc/trpcClient';

import s from './UserFormWorkSpaceDismissalFormBlock.module.css';
import { tr } from './UserFormWorkSpaceDismissalFormBlock.i18n';

interface UserFormWorkSpaceDismissalFormBlockProps {
    className: string;
    id: string;
    type?: 'new' | 'readOnly' | 'edit';
    requestId?: string;
}

interface UserFormWorkSpaceDismissalFormBlockType {
    workMode: string;
    workSpace?: string;
    location: string;
    applicationForReturnOfEquipment?: string;
    attachIds: string[];
}

const Attaches = ({ id, onDelete }: { id: string; onDelete?: (id: string) => void }) => {
    const requestQuery = trpc.scheduledDeactivation.getById.useQuery(id, { enabled: !!id });
    return <AttachList attaches={requestQuery.data?.attaches} onDelete={onDelete} />;
};

export const UserFormWorkSpaceDismissalFormBlock = ({
    className,
    id,
    type,
    requestId,
}: UserFormWorkSpaceDismissalFormBlockProps) => {
    const {
        register,
        setValue,
        trigger,
        watch,
        getValues,
        formState: { errors },
    } = useFormContext<UserFormWorkSpaceDismissalFormBlockType>();

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    const onFileChange = useCallback(
        (files: { type: string; filePath: string; name: string }[]) => {
            setValue(
                'attachIds',
                files.map(({ filePath }) => getFileIdFromPath(filePath)),
            );
            errors.attachIds && trigger('attachIds');
        },
        [errors.attachIds, setValue, trigger],
    );

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
                <FormControl label={tr('Devices return application')} error={errors.applicationForReturnOfEquipment}>
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
            <FormControl label={tr('Photo report')} error={errors.attachIds}>
                {nullable(type !== 'readOnly', () => (
                    <FormControlFileUpload
                        accept={{
                            'image/*': ['.jpeg', '.png'],
                        }}
                        translates={{
                            idle: tr('Add screenshot or photo from personal account'),
                            active: tr('Drop file here'),
                            loading: tr('Loading'),
                            accepted: tr('Loaded'),
                            error: tr("File doesn't load"),
                            fileExtensionsText: tr('In *.png or *.jpeg format'),
                        }}
                        uploadLink={pages.attaches}
                        onChange={onFileChange}
                    />
                ))}
                {nullable(type !== 'new' && requestId, (id) => (
                    <Attaches
                        id={id}
                        onDelete={
                            type !== 'readOnly'
                                ? (attachId) =>
                                      setValue(
                                          'attachIds',
                                          getValues('attachIds').filter((id) => id !== attachId),
                                      )
                                : undefined
                        }
                    />
                ))}
            </FormControl>
        </div>
    );
};
