import { trpc } from '../trpc/trpcClient';

export const useUserMutations = () => {
    const utils = trpc.useContext();

    return {
        createUser: trpc.user.create.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.getMemberships.invalidate();
            },
        }),

        addUserToGroup: trpc.user.addToGroup.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.getMemberships.invalidate();
            },
        }),

        removeUserFromGroup: trpc.user.removeFromGroup.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.getMemberships.invalidate();
            },
        }),

        editUserSettings: trpc.user.editSettings.useMutation({
            onMutate: (newSettings) => {
                utils.user.getSettings.setData(undefined, (oldSettings) => {
                    return oldSettings
                        ? {
                              userId: oldSettings.userId,
                              theme: newSettings.theme ?? oldSettings.theme,
                          }
                        : undefined;
                });
            },
            onSuccess: () => {
                utils.user.getSettings.invalidate();
            },
        }),

        editUser: trpc.user.edit.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
            },
        }),
    };
};
