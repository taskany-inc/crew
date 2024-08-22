import React, { ChangeEventHandler, FC } from 'react';
import { FieldError } from 'react-hook-form';
import { FormControl, FormControlError, FormControlLabel, Input, Text } from '@taskany/bricks/harmony';
import { gray7 } from '@taskany/colors';
import { nullable } from '@taskany/bricks';

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
        <FormControl>
            <FormControlLabel color={gray7}>{tr('Membership percentage')}</FormControlLabel>
            {nullable(
                submitButton,
                () => (
                    <div className={s.EditPercentageFormControlInputWrapper}>
                        <Input
                            view={errors.percentage ? 'danger' : 'default'}
                            brick="right"
                            outline
                            onChange={onPercentageChange}
                            defaultValue={initialPercentage}
                        />
                        {submitButton}
                    </div>
                ),
                <Input
                    view={errors.percentage ? 'danger' : 'default'}
                    outline
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
