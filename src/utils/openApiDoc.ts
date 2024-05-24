import { generateOpenApiDocument } from 'trpc-openapi';

import { restRouter } from '../trpc/router/restRouter';

export const openApiDoc = JSON.stringify(
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
