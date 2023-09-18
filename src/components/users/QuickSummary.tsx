import { gapL, gapM, gapS, gray9, gapXs } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';

import { PageSep } from '../PageSep';

import { tr } from './users.i18n';

const StyledQuickSummary = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapXs};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledPageSep = styled(PageSep)`
    white-space: nowrap;
    margin: 5px 0px;
    width: 300px;
`;

export const QuickSummary = () => {
    return (
        <>
            <StyledQuickSummary>
                <>
                    <Text as="span" size="m" color={gray9} weight="bold">
                        {tr('Quick summary')}
                        <StyledPageSep />
                    </Text>
                    <div>
                        <Text size="m" color={gray9}>
                            {tr('Supervisor:')}
                        </Text>
                    </div>
                </>
            </StyledQuickSummary>
        </>
    );
};
