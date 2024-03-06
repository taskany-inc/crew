import { ReactNode } from 'react';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { gapM, gapXs, gray9 } from '@taskany/colors';

import { PageSep } from './PageSep';

interface NarrowSectionProps {
    title?: string;
    children?: ReactNode;
}

const StyledPageSep = styled(PageSep)`
    margin-top: ${gapXs};
    margin-bottom: ${gapM};
`;

export const NarrowSection = ({ title, children }: NarrowSectionProps) => {
    return (
        <div>
            {nullable(title, (t) => (
                <Text size="m" color={gray9} weight="bold">
                    {t}
                </Text>
            ))}
            <StyledPageSep width={300} />
            {children}
        </div>
    );
};
