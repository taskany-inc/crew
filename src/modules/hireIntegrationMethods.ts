import { TRPCError } from '@trpc/server';

import { config } from '../config';

import { HireStream } from './hireIntegrationTypes';
import { tr } from './modules.i18n';

export const hireIntegrationMethods = {
    getHireStreams: async () => {
        if (!config.hireIntegration.apiToken) {
            throw new TRPCError({ code: 'FORBIDDEN', message: tr('No api token for hire') });
        }

        const response = await fetch(`${config.hireIntegration.apiUrl}/api/rest/hire-streams`, {
            method: 'GET',
            headers: {
                authorization: config.hireIntegration.apiToken,
            },
        });
        const json = await response.json();
        const items: HireStream[] = json;
        return items;
    },
};
