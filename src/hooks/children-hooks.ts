import { trpc } from '../trpc/trpcClient';

export const useGroupChildren = (id: string) => {
    return trpc.group.getChildren.useQuery({ id });
};
