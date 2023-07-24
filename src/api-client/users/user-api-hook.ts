import { useQuery } from 'react-query';

import { User } from './user-types';

export const userCacheKey = 'user';

const getUser = async (userId: string): Promise<User> => {
    return fetch(`/api/user/${userId}`, { method: 'GET' }).then((res) => res.json());
};

export const useUser = (userId: string) => {
    return useQuery([userCacheKey, userId], async () => getUser(userId), {
        onError: (error) => {
            console.log(error);
        },
    });
};
