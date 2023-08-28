import { trpc } from '../trpc/trpcClient';

export const useUsersOfGroup = (groupId: string) => {
    return trpc.user.getUsersOfGroup.useQuery({ groupId });
};
