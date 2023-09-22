import styled from 'styled-components';
import { ModalContent } from '@taskany/bricks';
import { gapL } from '@taskany/colors';

export const PreviewContent = styled(ModalContent)`
    padding-top: ${gapL};
    overflow: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;
