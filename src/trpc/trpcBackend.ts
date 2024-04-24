import { TRPCError, initTRPC } from '@trpc/server';
import { OpenApiMeta } from 'trpc-openapi';
import superjson from 'superjson';

import { prisma } from '../utils/prisma';

import type { TrpcContext } from './trpcContext';

const t = initTRPC.context<TrpcContext>().meta<OpenApiMeta>().create({
    transformer: superjson,
});

const sessionCheck = t.middleware(({ next, ctx }) => {
    const { session } = ctx;

    if (!session) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
        });
    }

    return next({
        ctx: { session, headers: ctx.headers },
    });
});

const apiTokenCheck = t.middleware(async ({ next, ctx }) => {
    if (!ctx.apiToken) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const token = await prisma.apiToken.findUnique({ where: { id: ctx.apiToken } });
    if (!token) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { apiToken: ctx.apiToken } });
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(sessionCheck);
export const restProcedure = t.procedure.use(apiTokenCheck);

export const { router, procedure } = t;
