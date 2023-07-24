import type { NextApiRequest, NextApiResponse } from 'next';

import { User } from '../../../api-client/users/user-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<User>) {
    const userResponse = await fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/users?userId=${req.query.userId}`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    });
    const user = await userResponse.json();
    res.status(200).json(user);
}
