import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { nullable } from '@taskany/bricks';
import { FormControlFileUpload } from '@taskany/bricks/harmony';

import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';
import { trpc } from '../../trpc/trpcClient';
import { AttachList } from '../AttachList/AttachList';
import { FormControl } from '../FormControl/FormControl';
import { useAppConfig } from '../../contexts/appConfigContext';
import { pages } from '../../hooks/useRouter';
import { getFileIdFromPath } from '../../utils/attachFormatter';

import { tr } from './UserFormAttaches.i18n';

interface UserFormAttachesProps {
    type?: 'new' | 'readOnly' | 'edit';
    requestId?: string;
    requestType:
        | 'dismiss'
        | 'transfer'
        | 'transferInternToStaff'
        | UserCreationRequestType.transferInside
        | UserCreationRequestType.toDecree;
}
const Attaches = ({
    id,
    onDelete,
    requestType,
}: {
    id: string;
    onDelete?: (id: string) => void;
    requestType: string;
}) => {
    const requestQuery =
        requestType === 'transferInternToStaff' || requestType === UserCreationRequestType.transferInside
            ? trpc.userCreationRequest.getById.useQuery(id, { enabled: !!id })
            : trpc.scheduledDeactivation.getById.useQuery(id, { enabled: !!id });

    return <AttachList attaches={requestQuery.data?.attaches} onDelete={onDelete} />;
};

export const UserFormAttaches = ({ type, requestId, requestType }: UserFormAttachesProps) => {
    const {
        setValue,
        trigger,
        getValues,
        formState: { errors },
    } = useFormContext<{ attachIds: string[] }>();

    const appConfig = useAppConfig();

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

    const attachIds = getValues('attachIds');

    return (
        <FormControl
            label={requestType !== UserCreationRequestType.toDecree ? tr('Photo report') : undefined}
            error={errors.attachIds}
        >
            {nullable(type !== 'readOnly', () => (
                <FormControlFileUpload
                    accept={{
                        'image/*': ['.jpeg', '.png'],
                    }}
                    translates={{
                        idle: tr('Add screenshot or photo from personal account {corpAppName}', {
                            corpAppName: appConfig?.corporateAppName || '',
                        }),
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
                    requestType={requestType}
                    id={id}
                    onDelete={
                        type !== 'readOnly'
                            ? (attachId) =>
                                  setValue(
                                      'attachIds',
                                      attachIds?.filter((id) => id !== attachId),
                                  )
                            : undefined
                    }
                />
            ))}
        </FormControl>
    );
};
