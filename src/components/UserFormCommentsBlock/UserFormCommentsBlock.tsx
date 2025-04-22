import React from 'react';
import { FormControlEditor, Text } from '@taskany/bricks/harmony';
import { useFormContext, Controller } from 'react-hook-form';
import { nullable, useCopyToClipboard } from '@taskany/bricks';

import { notifyPromise } from '../../utils/notifications/notifyPromise';
import { FormControl } from '../FormControl/FormControl';
import { UserFormAttaches } from '../UserFormAttaches/UserFormAttaches';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './UserFormCommentsBlock.module.css';
import { tr } from './UserFormCommentsBlock.i18n';

interface UserFormCommentsBlockProps {
    className: string;
    id: string;
    readOnly?: boolean;
    requestType?: UserCreationRequestType;
    requestId?: string;
}

export const UserFormCommentsBlock = ({
    className,
    id,
    readOnly,
    requestType,
    requestId,
}: UserFormCommentsBlockProps) => {
    const { control, watch } = useFormContext<{ comment?: string }>();
    const comment = watch('comment');

    const [, copy] = useCopyToClipboard();

    return (
        <div className={className} id={id} onClick={() => readOnly && comment && notifyPromise(copy(comment), 'copy')}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Comments')}
            </Text>

            <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                    <FormControl>
                        <FormControlEditor
                            disabled={readOnly}
                            outline
                            placeholder={tr('Write some comments if needed')}
                            {...field}
                            value={readOnly && !comment ? tr('Not specified') : comment}
                            disableAttaches
                        />
                    </FormControl>
                )}
            />

            {nullable(requestType === UserCreationRequestType.toDecree, () => (
                <UserFormAttaches
                    requestId={requestId}
                    requestType={UserCreationRequestType.toDecree}
                    type={readOnly ? 'readOnly' : 'edit'}
                />
            ))}
        </div>
    );
};
