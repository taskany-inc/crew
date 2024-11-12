import React, { useCallback } from 'react';
import { FormControlInput, FormControlFileUpload, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { nullable } from '@taskany/bricks';
import { IconFileOutline } from '@taskany/icons';

import { FormControl } from '../FormControl/FormControl';
import { PermissionServiceSelect } from '../PermissionServiceSelect/PermissionServiceSelect';
import { getFileIdFromPath } from '../../utils/attachFormatter';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';

import s from './UserFormExternalExtraInfoBlock.module.css';
import { tr } from './UserFormExternalExtraInfoBlock.i18n';

interface AttachListProps {
    requestId: string;
}

const AttachList = ({ requestId }: AttachListProps) => {
    const requestQuery = trpc.userCreationRequest.getById.useQuery(requestId);

    return nullable(requestQuery.data?.attaches, (attaches) => (
        <div>
            {attaches.map(({ id, filename }) => (
                <Link className={s.Link} key={id} href={pages.attach(id)} target="_blank">
                    <IconFileOutline size="s" /> {filename}
                </Link>
            ))}
        </div>
    ));
};

interface UserFormExternalExtraInfoBlockProps {
    className: string;
    id: string;
    type?: 'externalEmployee' | 'externalFromMain';
    readOnly?: boolean;
    requestId?: string;
    edit?: boolean;
}

export const UserFormExternalExtraInfoBlock = ({
    className,
    id,
    type,
    readOnly,
    requestId,
    edit,
}: UserFormExternalExtraInfoBlockProps) => {
    const {
        setValue,
        watch,
        register,
        trigger,
        formState: { errors },
    } = useFormContext<{
        permissionToServices: string[];
        reason: string;
        attachIds: string[];
    }>();

    const onFileChange = useCallback((files: { type: string; filePath: string; name: string }[]) => {
        setValue(
            'attachIds',
            files.map(({ filePath }) => getFileIdFromPath(filePath)),
        );
        errors.attachIds && trigger('attachIds');
    }, []);

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

            {nullable(
                type === 'externalEmployee' && !readOnly && !edit,
                () => (
                    <div className={s.Nda}>
                        <FormControl label="NDA" error={errors.attachIds} required>
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
                        </FormControl>

                        <AttachList requestId={id} />
                    </div>
                ),
                <>
                    {nullable(requestId, (id) => (
                        <div className={s.Nda}>
                            <FormControl label="NDA" error={errors.attachIds} required>
                                <AttachList requestId={id} />
                            </FormControl>
                        </div>
                    ))}
                </>,
            )}
        </div>
    );
};
