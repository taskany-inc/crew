import type { NextApiRequest, NextApiResponse } from 'next';

import { Group } from '../../../api-client/groups/group-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<Group>) {
    const groupResponse = await fetch(`${process.env.PROXY_BACKEND_URL}/api/v1/private/groups/${req.query.groupId}`, {
        method: 'GET',
        headers: { Authorization: process.env.PROXY_BACKEND_AUTH_HEADER as string },
    });
    const group = await groupResponse.json();
    res.status(200).json(group);
}
