import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateUserCreationRequest, EditUserCreationRequest } from './userCreationRequestSchemas';

export const useUserCreationRequestMutations = () => {
    const utils = trpc.useContext();

    const createUserCreationRequest = trpc.userCreationRequest.create.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const editUserCreationRequest = trpc.userCreationRequest.edit.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const declineUserRequest = trpc.userCreationRequest.decline.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const acceptUserRequest = trpc.userCreationRequest.accept.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    return {
        createUserCreationRequest: (data: CreateUserCreationRequest) =>
            notifyPromise(createUserCreationRequest.mutateAsync(data), 'userCreationRequestCreate'),

        declineUserRequest: (data: { id: string; comment?: string }) =>
            notifyPromise(declineUserRequest.mutateAsync(data), 'userCreationRequestDecline'),

        acceptUserRequest: (data: { id: string; comment?: string }) =>
            notifyPromise(acceptUserRequest.mutateAsync(data), 'userCreationRequestAccept'),

        editUserCreationRequest: (data: EditUserCreationRequest) =>
            notifyPromise(editUserCreationRequest.mutateAsync(data), 'userCreationRequestEdit'),
    };
};
