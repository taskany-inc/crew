import React, { ChangeEventHandler, FC } from 'react';
import { FieldError } from 'react-hook-form';
import { FormControl, FormControlError, FormControlLabel, Input, Text, nullable } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';

import { tr } from './EditPercentageFormControl.i18n';
import s from './EditPercentageFormControl.module.css';

interface EditPercentageFormControlProps {
    onPercentageChange: ChangeEventHandler<HTMLInputElement>;
    errors: {
        percentage?: FieldError;
    };
    maxPercentage: number;
    initialPercentage?: number;
    submitButton?: React.ReactNode;
}
export const EditPercentageFormControl: FC<EditPercentageFormControlProps> = ({
    onPercentageChange,
    errors,
    maxPercentage,
    initialPercentage,
    submitButton,
}) => {
    return (
        <FormControl error={errors.percentage !== undefined} variant="outline">
            <FormControlLabel as="div" color={gray7}>
                {tr('Membership percentage')}
            </FormControlLabel>
            {nullable(
                submitButton,
                () => (
                    <div className={s.EditPercentageFormControlInputWrapper}>
                        <Input brick="right" onChange={onPercentageChange} defaultValue={initialPercentage} />
                        {submitButton}
                    </div>
                ),
                <Input
                    className={s.EditPercentageFormControlInput}
                    onChange={onPercentageChange}
                    defaultValue={initialPercentage}
                />,
            )}
            {nullable(errors.percentage, (e) => (
                <FormControlError error={e} />
            ))}
            <Text size="s" color={gray7}>
                {tr.raw('Available: {max}', { max: maxPercentage })}
            </Text>
        </FormControl>
    );
};
