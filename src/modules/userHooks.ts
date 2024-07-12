import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import {
    AddUserToGroup,
    CreateUser,
    EditUserFields,
    EditUserActiveState,
    EditUserRoleData,
    EditUserSettings,
    RemoveUserFromGroup,
    EditUserMailingSettings,
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
                          showAchievements: newSettings.showAchievements ?? oldSettings.showAchievements,
                          locale: newSettings.locale ?? oldSettings.locale,
                      }
                    : undefined;
            });
        },
        onSuccess: () => {
            utils.user.getSettings.invalidate();
        },
    });

    const editUserMailingSettings = trpc.user.editMailingSettings.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
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

    const editUserRole = trpc.user.editUserRole.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
        },
    });

    return {
        createUser: (data: CreateUser) => notifyPromise(createUser.mutateAsync(data), 'userCreate'),

        editUserRole: (data: EditUserRoleData) => notifyPromise(editUserRole.mutateAsync(data), 'userUpdate'),

        addUserToGroup: (data: AddUserToGroup) => notifyPromise(addUserToGroup.mutateAsync(data), 'userAddToGroup'),

        removeUserFromGroup: (data: RemoveUserFromGroup) =>
            notifyPromise(removeUserFromGroup.mutateAsync(data), 'userRemoveFromGroup'),

        editUserSettings: (data: EditUserSettings) =>
            notifyPromise(editUserSettings.mutateAsync(data), 'userEditSettings'),

        editUserMailingSettings: (data: EditUserMailingSettings) =>
            notifyPromise(editUserMailingSettings.mutateAsync(data), 'userEditMailingSettings'),

        editUser: (data: EditUserFields) => notifyPromise(editUser.mutateAsync(data), 'userUpdate'),

        editUserActiveState: (data: EditUserActiveState) =>
            notifyPromise(editUserActiveState.mutateAsync(data), 'userUpdate'),
    };
};
