import { User } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { config } from '../config';
import { prisma } from '../utils/prisma';

import { GetHireStreamRecruiters, HireStream, HireUser } from './hireIntegrationTypes';
import { tr } from './modules.i18n';

const checkConfig = () => {
    if (!config.hireIntegration.url || !config.hireIntegration.apiToken) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Hire integration is not configured') });
    }
    return { url: config.hireIntegration.url, apiToken: config.hireIntegration.apiToken };
};

const getDataFromResponse = async <T>(response: Response): Promise<T> => {
    if (response.ok) {
        return response.json();
    }
    const message = await response.text();
    throw new TRPCError({ code: 'BAD_REQUEST', message });
};

export const hireIntegrationMethods = {
    getHireStreams: async () => {
        const { url, apiToken } = checkConfig();
        const response = await fetch(`${url}/api/rest/hire-streams`, {
            method: 'GET',
            headers: {
                authorization: apiToken,
            },
        });
        return getDataFromResponse<HireStream[]>(response);
    },

    getHireStreamRecruiters: async ({ id, search, take }: GetHireStreamRecruiters): Promise<User[]> => {
        const { url, apiToken } = checkConfig();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (take) params.append('take', String(take));
        const response = await fetch(`${url}/api/rest/hire-streams/${id}/recruiters?${params}`, {
            method: 'GET',
            headers: {
                authorization: apiToken,
            },
        });
        const hireUsers = await getDataFromResponse<HireUser[]>(response);
        const emails = hireUsers.map((u) => u.email);
        return prisma.user.findMany({ where: { email: { in: emails } } });
    },
};
