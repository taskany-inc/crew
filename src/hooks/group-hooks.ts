import { trpc } from '../trpc/trpcClient';

export const useGroup = (groupId: string) => {
    return trpc.group.getById.useQuery({ groupId });
};
