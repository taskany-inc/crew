import { nullable } from '@taskany/bricks';
import { FormControl as HarmonyFormControl, FormControlLabel, FormControlError } from '@taskany/bricks/harmony';
import { ReactNode } from 'react';

interface FormControlProps {
    label?: string;
    required?: boolean;
    error?: { message?: string };
    className?: string;
    children: ReactNode;
}

export const FormControl = ({ label, required, error, className, children }: FormControlProps) => {
    return (
        <HarmonyFormControl required={required} className={className}>
            {nullable(label, (l) => (
                <FormControlLabel>{l}</FormControlLabel>
            ))}
            {children}
            {nullable(error, (e) => (
                <FormControlError error={e} />
            ))}
        </HarmonyFormControl>
    );
};
