import { Group, GroupsPage } from './group-types';

export const groupCacheKey = 'group';

export const getGroup = async (groupId: string): Promise<Group> => {
    return fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/private/groups/${groupId}`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    }).then((res) => res.json());
};

export const getGroupChildren = async (id: string): Promise<GroupsPage> => {
    const res = await fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/private/groups/${id}/children`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    });
    return res.json();
};
