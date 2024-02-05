import { GetServerSidePropsContext } from 'next';
import { DehydratedState } from '@tanstack/react-query';
import { getServerSession, Session } from 'next-auth';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { createServerSideHelpers, DecoratedProcedureSSGRecord } from '@trpc/react-query/server';
import superjson from 'superjson';
import type { ErrorProps } from 'next/error';
import { z } from 'zod';

import { trpcRouter, TrpcRouter } from '../trpc/router';
import { pages } from '../hooks/useRouter';

import { authOptions } from './auth';
import { objKeys } from './objKeys';
import { tr } from './utils.i18n';

type SsgHelper = DecoratedProcedureSSGRecord<TrpcRouter>;

type Props = Record<never, unknown> & { notFound?: boolean } & { redirect?: { destination: string } };

type SsrOptions<
    Num extends string,
    Str extends string,
    ReqSession extends boolean,
    AdditionalProps extends Props,
    ActionArgs = {
        context: GetServerSidePropsContext;
        session: ReqSession extends true ? Session : null;
        ssg: SsgHelper;
        numberIds: Record<Num, number>;
        stringIds: Record<Str, string>;
    },
> = {
    requireSession: ReqSession;
    numberIds?: Record<Num, true>;
    stringIds?: Record<Str, true>;
    action?: (args: ActionArgs) => Promise<AdditionalProps | void> | AdditionalProps | void;
};

type InferredServerSidePropsFromSSROptions<
    Num extends string,
    Str extends string,
    ReqSession extends boolean,
    AdditionalProps extends Props,
> =
    | {
          props: {
              session: ReqSession extends true ? Session : null;
              trpcState: DehydratedState;
              numberIds: Record<Num, number>;
              stringIds: Record<Str, string>;
              error: ErrorProps | null;
          } & AdditionalProps;
      }
    | {
          redirect: { destination: string };
          props: { session: Session | null };
      }
    | { notFound: boolean };

export const createGetServerSideProps =
    <Num extends string, Str extends string, ReqSession extends boolean, AdditionalProps extends Props>(
        options: SsrOptions<Num, Str, ReqSession, AdditionalProps>,
    ) =>
    async (
        context: GetServerSidePropsContext,
    ): Promise<InferredServerSidePropsFromSSROptions<Num, Str, ReqSession, AdditionalProps>> => {
        const props: Record<string, unknown> = {};

        let session: Session | null = null;

        if (options.requireSession) {
            session = await getServerSession(context.req, context.res, authOptions);

            if (!session) {
                return { redirect: { destination: pages.signIn }, props: { session } };
            }
            props.session = session;
        }

        const ssgHelper = createServerSideHelpers({
            router: trpcRouter,
            ctx: { session, headers: context.req.headers },
            transformer: superjson,
        });

        await ssgHelper.user.getSettings.fetch();

        const numberIds = {} as Record<Num, number>;
        const stringIds = {} as Record<Str, string>;

        if (options.numberIds) {
            for (const key of objKeys(options.numberIds)) {
                const id = z.number().safeParse(context.query[key]);

                if (!id.success) {
                    throw new Error(tr('Invalid numeric parameter {key} in address', { key }));
                }

                numberIds[key] = id.data;
            }
        }

        if (options.stringIds) {
            for (const key of objKeys(options.stringIds)) {
                const id = context.query[key];

                if (!id || typeof id !== 'string') {
                    throw new Error(tr('Invalid string parameter {key} in address', { key }));
                }

                stringIds[key] = id;
            }
        }

        let additionalProps = {} as AdditionalProps;

        let error: ErrorProps | null = null;

        if (options.action) {
            try {
                const actionResult = await options.action({
                    context,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    session: session as any,
                    ssg: ssgHelper,
                    numberIds,
                    stringIds,
                });

                additionalProps = actionResult ?? ({} as AdditionalProps);

                if (additionalProps.notFound) {
                    return { notFound: true };
                }

                if (additionalProps.redirect) {
                    return { redirect: additionalProps.redirect, props: { session } };
                }
            } catch (e) {
                if (e instanceof TRPCError) {
                    if (e.code === 'NOT_FOUND') {
                        return { notFound: true };
                    }
                    const code = getHTTPStatusCodeFromError(e);
                    context.res.statusCode = code;
                    error = { statusCode: code, title: e.message };
                } else {
                    throw e;
                }
            }
        }

        return {
            props: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session: session as any,
                trpcState: ssgHelper.dehydrate(),
                numberIds,
                stringIds,
                error,
                ...additionalProps,
            },
        };
    };
