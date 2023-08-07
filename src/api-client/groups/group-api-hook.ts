import { useQuery } from 'react-query';

import { Group } from './group-types';

export const groupCacheKey = 'group';

const getGroup = async (groupId: string): Promise<Group> => {
    return fetch(`/api/group/${groupId}`, { method: 'GET' }).then((res) => res.json());
};

export const useGroup = (groupId: string) => {
    return useQuery([groupCacheKey, groupId], async () => getGroup(groupId), {
        // TODO: toasts in pr #76
        onError: (error) => console.log(error),
    });
};
