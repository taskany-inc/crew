import React, { useCallback, useState } from 'react';
import { FormControlInput, FormControlFileUpload, Text, Button } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { nullable } from '@taskany/bricks';
import { IconBinOutline, IconFileOutline } from '@taskany/icons';
import { Attach } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { PermissionServiceSelect } from '../PermissionServiceSelect/PermissionServiceSelect';
import { getFileIdFromPath } from '../../utils/attachFormatter';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { useAttachMutations } from '../../modules/attachHooks';
import { useBoolean } from '../../hooks/useBoolean';
import { WarningModal } from '../WarningModal/WarningModal';

import { tr } from './UserFormExternalExtraInfoBlock.i18n';
import s from './UserFormExternalExtraInfoBlock.module.css';

interface AttachListProps {
    requestId: string;
    onDelete?: (id: string) => void;
}

const AttachList = ({ requestId, onDelete }: AttachListProps) => {
    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);
    const deleteAttachVisible = useBoolean(false);

    const { deleteAttach } = useAttachMutations();
    const [attach, setAttach] = useState<undefined | Attach>();

    const onDeleteClick = (currentAttach: Attach) => {
        setAttach(currentAttach);
        deleteAttachVisible.setTrue();
    };

    const confirmAttachDelete = () => {
        if (onDelete && attach) {
            onDelete(attach.id);
            deleteAttach(attach.id);
            deleteAttachVisible.setFalse();
        }
    };

    const cancelAttachDelete = () => {
        setAttach(undefined);
        deleteAttachVisible.setFalse();
    };

    return nullable(requestQuery.data?.attaches, (attaches) => (
        <>
            {attaches.map((file) => (
                <div className={s.AttachItem} key={`attach-${file.id}`}>
                    <Link className={s.Link} href={pages.attach(file.id)} target="_blank">
                        <IconFileOutline size="s" /> {file.filename}{' '}
                    </Link>
                    {nullable(onDelete, () => (
                        <Button
                            type="button"
                            view="ghost"
                            size="s"
                            className={s.IconBin}
                            iconLeft={<IconBinOutline size="s" onClick={() => onDeleteClick(file)} />}
                        />
                    ))}
                </div>
            ))}
            <WarningModal
                view="warning"
                visible={deleteAttachVisible.value}
                onCancel={cancelAttachDelete}
                onConfirm={confirmAttachDelete}
                warningText={tr('attach deleting confirmation {filename}', { filename: attach?.filename || '' })}
            />
        </>
    ));
};

interface UserFormExternalExtraInfoBlockProps {
    className: string;
    id: string;
    type?: 'externalEmployee' | 'externalFromMain';
    readOnly?: boolean;
    requestId?: string;
}

export const UserFormExternalExtraInfoBlock = ({
    className,
    id,
    type,
    readOnly,
    requestId,
}: UserFormExternalExtraInfoBlockProps) => {
    const {
        setValue,
        watch,
        register,
        trigger,
        getValues,
        formState: { errors },
    } = useFormContext<{
        permissionToServices: string[];
        reason: string;
        attachIds: string[];
    }>();

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
                {tr('Extra information')}
            </Text>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Permission to services')} required>
                    <PermissionServiceSelect
                        readOnly={readOnly}
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
                        readOnly={readOnly}
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

            {nullable(type === 'externalEmployee', () => (
                <div className={s.Nda}>
                    <FormControl label="NDA" error={errors.attachIds} required>
                        {nullable(!readOnly, () => (
                            <FormControlFileUpload
                                accept={{
                                    'application/pdf': [],
                                    'application/msword': [],
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
                                }}
                                translates={{
                                    idle: tr('Choose file'),
                                    active: tr('Drop file here'),
                                    loading: tr('Loading'),
                                    accepted: tr('Loaded'),
                                    error: tr("File doesn't load"),
                                    fileExtensionsText: tr('In *.pdf or *.doc / *.docx format'),
                                }}
                                uploadLink={pages.attaches}
                                onChange={onFileChange}
                            />
                        ))}
                        {nullable(requestId, (id) => (
                            <AttachList
                                requestId={id}
                                onDelete={
                                    !readOnly
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
            ))}
        </div>
    );
};
