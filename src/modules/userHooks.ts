import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import {
    AddUserToGroup,
    EditUser,
    EditUserActiveState,
    EditUserRoleData,
    EditUserSettings,
    RemoveUserFromGroup,
    EditUserMailingSettings,
    UpdateMembershipPercentage,
} from './userSchemas';

export const useUserMutations = () => {
    const utils = trpc.useContext();

    const addUserToGroup = trpc.user.addToGroup.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.getMemberships.invalidate();
        },
    });

    const updatePercentage = trpc.user.updatePercentage.useMutation({
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
                          beta: newSettings.beta ?? oldSettings.beta,
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

    const isLoginUnique = utils.user.isLoginUnique.fetch;

    return {
        editUserRole: (data: EditUserRoleData) => notifyPromise(editUserRole.mutateAsync(data), 'userUpdate'),

        addUserToGroup: (data: AddUserToGroup) => notifyPromise(addUserToGroup.mutateAsync(data), 'userAddToGroup'),

        updatePercentage: (data: UpdateMembershipPercentage) =>
            notifyPromise(updatePercentage.mutateAsync(data), 'userUpdatePercentage'),

        removeUserFromGroup: (data: RemoveUserFromGroup) =>
            notifyPromise(removeUserFromGroup.mutateAsync(data), 'userRemoveFromGroup'),

        editUserSettings: (data: EditUserSettings) =>
            notifyPromise(editUserSettings.mutateAsync(data), 'userEditSettings'),

        editUserMailingSettings: (data: EditUserMailingSettings) =>
            notifyPromise(editUserMailingSettings.mutateAsync(data), 'userEditMailingSettings'),

        editUser: (data: EditUser) => notifyPromise(editUser.mutateAsync(data), 'userUpdate'),

        editUserActiveState: (data: EditUserActiveState) =>
            notifyPromise(editUserActiveState.mutateAsync(data), 'userUpdate'),

        isLoginUnique: (login: string) => isLoginUnique(login),
    };
};
