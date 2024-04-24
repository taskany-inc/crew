import { inferAsyncReturnType } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '../utils/auth';

export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
    const session = await getServerSession(opts.req, opts.res, authOptions);
    const apiToken = opts.req.headers.authorization;

    return { session, headers: opts.req.headers, apiToken };
};

export type TrpcContext = inferAsyncReturnType<typeof createContext>;
