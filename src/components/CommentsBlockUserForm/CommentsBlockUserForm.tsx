import React from 'react';
import { FormControlEditor, Text } from '@taskany/bricks/harmony';
import { useFormContext, Controller } from 'react-hook-form';

import { FormControl } from '../FormControl/FormControl';

import s from './CommentsBlockUserForm.module.css';
import { tr } from './CommentsBlockUserForm.i18n';

interface CommentsBlockUserFormProps {
    className: string;
    id: string;
}

export const CommentsBlockUserForm = ({ className, id }: CommentsBlockUserFormProps) => {
    const { control } = useFormContext();

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Comments')}
            </Text>

            <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                    <FormControl>
                        <FormControlEditor outline placeholder={tr('Write some comments if needed')} {...field} />
                    </FormControl>
                )}
            />
        </div>
    );
};
