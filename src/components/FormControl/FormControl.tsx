import { nullable } from '@taskany/bricks';
import { FormControl as HarmonyFormControl, FormControlLabel, FormControlError, Text } from '@taskany/bricks/harmony';
import { ReactNode } from 'react';

import s from './FormControl.module.css';

interface FormControlProps {
    label: string;
    required?: boolean;
    error?: { message?: string };
    children: ReactNode;
}

export const FormControl = ({ label, required, error, children }: FormControlProps) => {
    return (
        <HarmonyFormControl>
            <FormControlLabel>
                {label}
                {required && (
                    <Text as="span" className={s.Required}>
                        {' '}
                        *
                    </Text>
                )}
            </FormControlLabel>
            <div className={s.FormControlInput}>{children}</div>
            {nullable(error, (e) => (
                <FormControlError error={e} />
            ))}
        </HarmonyFormControl>
    );
};
