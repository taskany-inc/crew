import axios from 'axios';
import { useQuery } from 'react-query';

import { User } from './user-types';

export const userCacheKey = 'user';

const instance = axios.create({
    headers: {
        Authorization: process.env.PROXY_BACKEND_AUTH_HEADER,
    },
});

const getUser = async (userId: string): Promise<User> => {
    return (await instance(`/api/v1/users?userId=${userId}`)).data;
};

export const useUser = (userId: string) => {
    return useQuery([userCacheKey, userId], async () => getUser(userId), {
        onError: (error) => {
            console.log(error);
        },
    });
};
