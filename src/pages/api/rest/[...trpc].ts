import { createOpenApiNextHandler } from 'trpc-openapi';

import { restRouter } from '../../../trpc/router/restRouter';
import { createContext } from '../../../trpc/trpcContext';

export default createOpenApiNextHandler({ router: restRouter, createContext });
