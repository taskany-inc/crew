import { generateOpenApiDocument } from 'trpc-openapi';

import { createGetServerSideProps } from '../utils/createGetSSRProps';
import { restRouter } from '../trpc/router/restRouter';
import { DocsPage } from '../components/DocsPage';

const openApiDoc = JSON.stringify(
    generateOpenApiDocument(restRouter, {
        title: 'Crew OpenAPI',
        version: '1.0.0',
        baseUrl: '/api/rest',
        securitySchemes: {
            AuthToken: {
                type: 'apiKey',
                in: 'header',
                name: 'Authorization',
            },
        },
    }),
);

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: () => {
        return { openApiDoc };
    },
});

export default DocsPage;
