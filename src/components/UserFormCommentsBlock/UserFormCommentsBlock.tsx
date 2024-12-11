import React from 'react';
import { FormControlEditor, Text } from '@taskany/bricks/harmony';
import { useFormContext, Controller } from 'react-hook-form';
import { useCopyToClipboard } from '@taskany/bricks';

import { notifyPromise } from '../../utils/notifications/notifyPromise';
import { FormControl } from '../FormControl/FormControl';

import s from './UserFormCommentsBlock.module.css';
import { tr } from './UserFormCommentsBlock.i18n';

interface UserFormCommentsBlockProps {
    className: string;
    id: string;
    readOnly?: boolean;
}

export const UserFormCommentsBlock = ({ className, id, readOnly }: UserFormCommentsBlockProps) => {
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
                            value={readOnly && !comment ? 'Not specified' : comment}
                            disableAttaches
                        />
                    </FormControl>
                )}
            />
        </div>
    );
};
