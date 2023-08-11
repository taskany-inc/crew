import { trpc } from '../trpc/trpcClient';

export const useUser = (userId: string) => {
    return trpc.user.getById.useQuery({ userId });
};
