import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import {
    AddUserToGroup,
    CreateUser,
    EditUser,
    EditUserActiveState,
    EditUserSettings,
    RemoveUserFromGroup,
} from './userSchemas';

export const useUserMutations = () => {
    const utils = trpc.useContext();

    const createUser = trpc.user.create.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.getMemberships.invalidate();
        },
    });

    const addUserToGroup = trpc.user.addToGroup.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.getMemberships.invalidate();
        },
    });

    const removeUserFromGroup = trpc.user.removeFromGroup.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.getMemberships.invalidate();
        },
    });

    const editUserSettings = trpc.user.editSettings.useMutation({
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
    });

    const editUser = trpc.user.edit.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
        },
    });

    const editUserActiveState = trpc.user.editActiveState.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
        },
    });

    return {
        createUser: (data: CreateUser) => notifyPromise(createUser.mutateAsync(data), 'userCreate'),

        addUserToGroup: (data: AddUserToGroup) => notifyPromise(addUserToGroup.mutateAsync(data), 'userAddToGroup'),

        removeUserFromGroup: (data: RemoveUserFromGroup) =>
            notifyPromise(removeUserFromGroup.mutateAsync(data), 'userRemoveFromGroup'),

        editUserSettings: (data: EditUserSettings) =>
            notifyPromise(editUserSettings.mutateAsync(data), 'userEditSettings'),

        editUser: (data: EditUser) => notifyPromise(editUser.mutateAsync(data), 'userUpdate'),

        editUserActiveState: (data: EditUserActiveState) =>
            notifyPromise(editUserActiveState.mutateAsync(data), 'userUpdate'),
    };
};
