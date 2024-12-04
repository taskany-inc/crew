import { inferRouterOutputs } from '@trpc/server';

import { TrpcRouter } from './router';

type RouterOutputs = inferRouterOutputs<TrpcRouter>;

export type UserRequest = RouterOutputs['userCreationRequest']['getList'][number];

export type AppConfig = RouterOutputs['appConfig']['get'];
