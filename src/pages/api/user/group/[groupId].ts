import type { NextApiRequest, NextApiResponse } from 'next';

import { UsersPage } from '../../../../api-client/users/user-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<UsersPage>) {
    const usersOfGroupResponse = await fetch(
        `${process.env.PROXY_BACKEND_URL}api/v1/private/users/group/${req.query.groupId}`,
        {
            method: 'POST',
            headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
        },
    );
    const usersOfGroup = await usersOfGroupResponse.json();
    res.status(200).json(usersOfGroup);
}
