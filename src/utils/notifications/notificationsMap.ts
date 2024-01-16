import { tr } from './notifications.i18n';

export interface NotificationEvents {
    loading: string;
    success: string;
    error: string;
}

type NamespacedAction<T extends string, A extends string> = `${T}${A}`;

export type NotificationNamespaces =
    | NamespacedAction<'user', 'Create' | 'Update' | 'AddToGroup' | 'RemoveFromGroup' | 'EditSettings'>
    | NamespacedAction<'group', 'Create' | 'Update' | 'Archive' | 'Move'>
    | NamespacedAction<'role', 'AddToMembership' | 'RemoveFromMembership'>
    | NamespacedAction<'service', 'AddToUser'>
    | NamespacedAction<'device', 'AddToUser'>
    | NamespacedAction<'bonusPoints', 'Change'>
    | 'sendFeedback';

export type NotificationMap = Record<NotificationNamespaces, Partial<NotificationEvents>>;

export const defaultNotifications: NotificationEvents = {
    success: tr('Voila! 🎉'),
    loading: tr('Loading...'),
    error: tr('Something went wrong 😿'),
};

export const getNotificicationKeyMap = (key: keyof NotificationMap) => {
    const notification: NotificationMap = {
        userCreate: {
            success: tr('Voila! User is here 🎉'),
            loading: tr('Creating the user...'),
        },
        userUpdate: {
            success: tr('User is updated'),
            loading: tr('Updating the user...'),
        },
        userAddToGroup: {
            success: tr('User is added to group'),
            loading: tr('Creating membership...'),
        },
        userRemoveFromGroup: {
            success: tr('User is removed from group'),
            loading: tr('Removing membership...'),
        },
        userEditSettings: {
            success: tr('Voila! Successfully updated 🎉'),
            loading: tr('Updating user settings...'),
        },
        groupCreate: {
            success: tr('Voila! Team is here 🎉'),
            loading: tr('Creating the team...'),
        },
        groupUpdate: {
            success: tr('Team is updated'),
            loading: tr('Updating the team...'),
        },
        groupArchive: {
            success: tr('Team is archived'),
            loading: tr('Archiving the team...'),
        },
        groupMove: {
            success: tr('Team is transfered'),
            loading: tr('Transfering the team...'),
        },
        roleAddToMembership: {
            success: tr('Role is added'),
            loading: tr('Adding role...'),
        },
        roleRemoveFromMembership: {
            success: tr('Role is removed'),
            loading: tr('Removing the role...'),
        },
        serviceAddToUser: {
            success: tr('Service is added'),
            loading: tr('Adding service...'),
        },
        deviceAddToUser: {
            success: tr('Device is added'),
            loading: tr('Adding device...'),
        },
        bonusPointsChange: {
            success: tr('Bonus points balance is updated 🎉'),
            loading: tr('Updating bonus points balance...'),
        },
        sendFeedback: {
            success: tr('Feedback is sent 🎉'),
            loading: tr('Feedback is formed'),
        },
    };

    return notification[key];
};