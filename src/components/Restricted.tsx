import { ReactNode } from 'react';

interface RestrictedProps {
    visible: boolean;
    children: ReactNode;
}

export const Restricted = ({ visible, children }: RestrictedProps) => {
    return visible ? children : null;
};
