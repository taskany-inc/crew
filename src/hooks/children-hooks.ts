import { trpc } from '../trpc/trpcClient';

export const useGroupChildren = (id: string) => {
    return trpc.groupChildren.getById.useQuery({ id });
};
