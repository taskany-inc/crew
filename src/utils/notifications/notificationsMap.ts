import { tr } from './notifications.i18n';

export interface NotificationEvents {
    loading: string;
    success: string;
    error: string;
}
type NamespacedAction<T extends string, A extends string> = `${T}${A}`;

export type NotificationNamespaces =
    | NamespacedAction<
          'user',
          | 'Create'
          | 'Update'
          | 'AddToGroup'
          | 'RemoveFromGroup'
          | 'EditSettings'
          | 'EditMailingSettings'
          | 'UpdatePercentage'
      >
    | NamespacedAction<'group', 'Create' | 'Update' | 'Archive' | 'Move' | 'AddAdmin' | 'RemoveAdmin'>
    | NamespacedAction<'vacancy', 'Create' | 'Update' | 'Archive'>
    | NamespacedAction<'role', 'AddToMembership' | 'RemoveFromMembership'>
    | NamespacedAction<'service', 'AddToUser' | 'Delete'>
    | NamespacedAction<'device', 'AddToUser' | 'Delete'>
    | NamespacedAction<'achievement', 'Give'>
    | NamespacedAction<'userCreationRequest', 'Create' | 'Decline' | 'Accept' | 'Edit' | 'Cancel' | 'DraftConfirm'>
    | NamespacedAction<'userDecreeRequest', 'Create' | 'Decline' | 'Accept' | 'Edit' | 'Cancel'>
    | NamespacedAction<'scheduledDeactivation', 'Create' | 'Edit' | 'Cancel'>
    | NamespacedAction<'bonusPoints', 'Change'>
    | NamespacedAction<'userRole', 'ChangeScope'>
    | NamespacedAction<'attach', 'Delete'>
    | NamespacedAction<'supplementalPosition', 'Add' | 'Remove' | 'CreateRequest' | 'CancelRequest' | 'UpdateRequest'>
    | NamespacedAction<'transferInternToStaffRequest', 'Create' | 'Edit' | 'Cancel'>
    | NamespacedAction<'transferInsideRequest', 'Create' | 'Cancel' | 'Edit'>
    | 'sendFeedback'
    | 'copy';

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
        userEditMailingSettings: {
            success: tr('User is added to mailing list'),
            loading: tr('Adding user to mailing list...'),
        },
        userUpdatePercentage: {
            success: tr('Percentage is updated'),
            loading: tr('Updating the percentage...'),
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
        vacancyCreate: {
            success: tr('Voila! Vacancy is here 🎉'),
            loading: tr('Creating the vacancy...'),
        },
        vacancyUpdate: {
            success: tr('Vacancy is updated'),
            loading: tr('Updating the vacancy...'),
        },
        vacancyArchive: {
            success: tr('Vacancy is archived'),
            loading: tr('Archiving the vacancy...'),
        },
        serviceDelete: {
            success: tr('Service is deleted'),
            loading: tr('Deleting the service...'),
        },
        deviceDelete: {
            success: tr('Device is deleted'),
            loading: tr('Deleting the device...'),
        },
        achievementGive: {
            success: tr('Achievement is awarded!'),
            loading: tr('Awarding an achievement...'),
        },
        copy: {
            success: tr('Successfully copied'),
            loading: tr('Copying...'),
            error: tr('An error occurred while copying'),
        },
        userCreationRequestCreate: {
            success: tr('Voila! User creation request is created 🎉'),
            loading: tr('Creating a user creation request...'),
        },
        userCreationRequestDecline: {
            success: tr('User creation request was declined'),
            loading: tr('Declining a user creation request...'),
        },
        userCreationRequestAccept: {
            success: tr('Voila! User is here 🎉'),
            loading: tr('Creating the user...'),
        },
        userCreationRequestEdit: {
            success: tr('Voila! User creation request is edited 🎉'),
            loading: tr('Editing a user creation request...'),
        },
        userCreationRequestCancel: {
            success: tr('User creation request was cancelled'),
            loading: tr('Cancelling a user creation request...'),
        },
        userCreationRequestDraftConfirm: {
            success: tr('Voila! User creation request is submitted 🎉'),
            loading: tr('Submitting the user creation request...'),
        },
        userDecreeRequestCreate: {
            success: tr('Voila! User decree request is created 🎉'),
            loading: tr('Creating a user decree request...'),
        },
        userDecreeRequestDecline: {
            success: tr('Voila! User decree request was declined 🎉'),
            loading: tr('Declining a user decree request...'),
        },
        userDecreeRequestAccept: {
            success: tr('Voila! User decree request was completed 🎉'),
            loading: tr('Processing a user decree request...'),
        },
        userDecreeRequestEdit: {
            success: tr('Voila! User decree request is edited 🎉'),
            loading: tr('Editing a user decree request...'),
        },
        userDecreeRequestCancel: {
            success: tr('Voila! User decree request was cancelled 🎉'),
            loading: tr('Cancelling a user decree request...'),
        },
        scheduledDeactivationCreate: {
            success: tr('Profile deactivation is scheduled!'),
            loading: tr('Scheduling profile deactivation...'),
            error: tr('An error occurred while scheduling profile deactivation'),
        },
        groupAddAdmin: {
            success: tr('Voila! User is added to group administrators 🎉'),
            loading: tr('Adding the user...'),
        },
        groupRemoveAdmin: {
            success: tr('Voila! User is removed from group administrators 🎉'),
            loading: tr('Removing the user...'),
        },
        userRoleChangeScope: {
            success: tr('Role is changed'),
            loading: tr('Changing role...'),
            error: tr('An error occurred while changing role'),
        },
        scheduledDeactivationEdit: {
            success: tr('Profile deactivation is edited!'),
            loading: tr('Editing profile deactivation...'),
            error: tr('An error occurred while editing profile deactivation'),
        },
        scheduledDeactivationCancel: {
            success: tr('Profile deactivation is canceled!'),
            loading: tr('Canceling profile deactivation...'),
            error: tr('An error occurred while canceling profile deactivation'),
        },
        attachDelete: {
            success: tr('Attach successfully deleted!'),
            loading: tr('Deleting...'),
            error: tr('An error occurred while deleting'),
        },
        supplementalPositionAdd: {
            success: tr('Supplemental position added to user'),
            loading: tr('Adding the supplemental position...'),
        },
        supplementalPositionRemove: {
            success: tr('Supplemental position removed from user'),
            loading: tr('Removing the supplemental position...'),
        },
        transferInternToStaffRequestCreate: {
            success: tr('Voila! Transfer intern to staff request is created 🎉'),
            loading: tr('Creating transfer intern to staff request...'),
        },
        transferInternToStaffRequestEdit: {
            success: tr('Voila! Transfer intern to staff request is edited 🎉'),
            loading: tr('Editing transfer intern to staff request...'),
        },
        transferInternToStaffRequestCancel: {
            success: tr('Voila! Transfer intern to staff request is canceled 🎉'),
            loading: tr('Canceling transfer intern to staff request...'),
        },
        transferInsideRequestCreate: {
            success: tr('Voila! Transfer employee inside organization created 🎉'),
            loading: tr('Creating transfer employee inside organization request...'),
        },
        transferInsideRequestEdit: {
            success: tr('Voila! Transfer employee inside organization updated 🎉'),
            loading: tr('Updating transfer employee inside organization request...'),
        },
        transferInsideRequestCancel: {
            success: tr('Voila! Transfer employee inside organization is canceled 🎉'),
            loading: tr('Canceling transfer employee inside organization request...'),
        },
        supplementalPositionCreateRequest: {
            success: tr('Voila! Request for supplemental position created 🎉'),
            loading: tr('Creating request for supplemental position...'),
        },
        supplementalPositionCancelRequest: {
            success: tr('Voila! Request for supplemental position canceled 🎉'),
            loading: tr('Canceling request for supplemental position...'),
        },
        supplementalPositionUpdateRequest: {
            success: tr('Voila! Request for supplemental position updated 🎉'),
            loading: tr('Updating request for supplemental position...'),
        },
    };

    return notification[key];
};
