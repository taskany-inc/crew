import { useQuery } from 'react-query';

import { Group } from './group-types';

export const groupCacheKey = 'group';

export const getGroup = async (groupId: string): Promise<Group> => {
    return fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/private/groups/${groupId}`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    }).then((res) => res.json());
};
