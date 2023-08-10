import { trpc } from '../trpc/trpcClient';

export const useUsersOfGroup = (groupId: string) => {
    return trpc.usersOfGroup.getById.useQuery({ groupId });
};
