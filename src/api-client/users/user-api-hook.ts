import { User, UsersPage } from './user-types';

export const userCacheKey = 'user';
export const usersCacheKey = 'users';

export const getUser = async (userId: string): Promise<User> => {
    const res = await fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/users?userId=${userId}`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    });
    return res.json();
};

export const getUsersOfGroup = async (groupId: string): Promise<UsersPage> => {
    const res = await fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/private/users/group/${groupId}`, {
        method: 'POST',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    });
    return res.json();
};
