import styled from 'styled-components';
import { gray4 } from '@taskany/colors';

type PageSepProps = {
    width?: number;
};

export const PageSep = styled.div<PageSepProps>`
    border-top: 1px solid ${gray4};

    width: ${({ width }) => (width ? `${width}px` : 'auto')};
`;
