import { useQuery } from 'react-query';

import { GroupUsersFetchParams, User, UsersPage } from './user-types';

export const userCacheKey = 'user';
export const usersCacheKey = 'users';

const getUser = async (userId: string): Promise<User> => {
    return fetch(`/api/user/${userId}`, { method: 'GET' }).then((res) => res.json());
};

export const useUser = (userId: string) => {
    return useQuery([userCacheKey, userId], async () => getUser(userId), {
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log(error);
        },
    });
};

export const getUsersOfGroup = async (groupId: string): Promise<UsersPage> => {
    return fetch(`/api/user/group/${groupId}`, { method: 'POST' }).then((res) => res.json());
};
