import { TRPCClientError, httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';

import { pages } from '../hooks/useRouter';

import type { TrpcRouter } from './router';

function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // browser should use relative path
        return '';
    }
    return process.env.NEXTAUTH_URL;
}

const queryRetries = 3;

const handleUnauthorizedErrorOnClient = (error: unknown): boolean => {
    if (typeof window === 'undefined') return false;
    if (!(error instanceof TRPCClientError)) return false;
    if (error.data?.code !== 'UNAUTHORIZED') return false;

    document.location.href = pages.signIn;

    return true;
};

export const trpc = createTRPCNext<TrpcRouter>({
    config: ({ ctx }) => {
        return {
            transformer: superjson,
            queryClientConfig: {
                defaultOptions: {
                    queries: {
                        retry: (failureCount, error) => {
                            if (handleUnauthorizedErrorOnClient(error)) {
                                return false;
                            }
                            return failureCount < queryRetries;
                        },
                    },
                    mutations: {
                        retry: (_, error) => {
                            handleUnauthorizedErrorOnClient(error);
                            return false;
                        },
                    },
                },
            },

            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    headers: async () => {
                        if (ctx?.req) {
                            // https://trpc.io/docs/nextjs/ssr#q-why-do-i-need-to-delete-the-connection-header-when-using-ssr-on-node-18
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { connection, ...headers } = ctx.req.headers;

                            return {
                                ...headers,
                                // Optional: inform server that it's an SSR request
                                'x-ssr': '1',
                            };
                        }

                        return {};
                    },
                }),
            ],
        };
    },
    ssr: false,
});
