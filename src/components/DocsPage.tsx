import { useCallback } from 'react';
import 'swagger-ui-react/swagger-ui.css';
import { Button } from '@taskany/bricks';
import styled from 'styled-components';
import { gapM, gapXl } from '@taskany/colors';

import { downloadAsFile } from '../utils/downloadAsFile';

import { Link } from './Link';
import { LayoutMain } from './LayoutMain';
import { tr } from './components.i18n';

interface DocsPageProps {
    openApiDoc: string;
}

const StyledHeader = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${gapXl};
`;

const StyledButton = styled.span`
    margin: ${gapM};
`;

export const DocsPage = ({ openApiDoc }: DocsPageProps) => {
    const onClick = useCallback(async () => {
        downloadAsFile(openApiDoc, 'Crew OpenAPI', 'application/json');
    }, [openApiDoc]);

    return (
        <LayoutMain pageTitle="Crew OpenAPI">
            <StyledHeader>
                <Link href="/api-docs">Crew OpenAPI</Link>

                <StyledButton>
                    <Button outline view="primary" size="s" type="button" text={tr('Download')} onClick={onClick} />
                </StyledButton>
            </StyledHeader>
        </LayoutMain>
    );
};
