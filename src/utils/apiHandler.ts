// Only used to send attaches, waits when trpc will can send files
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { ErrorHandler, NextConnect } from 'next-connect';
import { urlencoded } from 'body-parser';
import { getServerSession } from 'next-auth/next';

import { authOptions } from './auth';

export const getAuthChecker = () => async (req: NextApiRequest, res: NextApiResponse, next: VoidFunction) => {
    const session = await getServerSession(req, res, authOptions);

    if (session) {
        req.session = session;
        next();
    } else {
        res.status(401).end();
    }
};

const onError: ErrorHandler<NextApiRequest, NextApiResponse> = (err, req, res) => {
    res.status(err.status).end(err.message);
};

export function getApiHandler(): NextConnect<NextApiRequest, NextApiResponse> {
    const app = nc<NextApiRequest, NextApiResponse>({ onError });

    app.use(urlencoded({ extended: true }));

    return app;
}
