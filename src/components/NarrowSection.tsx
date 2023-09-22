import { ReactNode } from 'react';
import { Text, nullable } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';

import { PageSep } from './PageSep';

type NarrowSectionProps = {
    title?: string;
    children?: ReactNode;
};

export const NarrowSection = ({ title, children }: NarrowSectionProps) => {
    return (
        <div>
            {nullable(title, (t) => (
                <Text size="m" color={gray9} weight="bold">
                    {t}
                </Text>
            ))}
            <PageSep width={300} margins={5} />
            {children}
        </div>
    );
};
