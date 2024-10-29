import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateUserCreationRequest, EditUserCreationRequest, UserDecreeSchema } from './userCreationRequestSchemas';

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

    const cancelUserRequest = trpc.userCreationRequest.cancel.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const createDecreeRequest = trpc.userCreationRequest.createDecreeRequest.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    return {
        createUserCreationRequest: (data: CreateUserCreationRequest) =>
            notifyPromise(createUserCreationRequest.mutateAsync(data), 'userCreationRequestCreate'),

        declineUserRequest: (data: { id: string; comment?: string }, type?: string) =>
            notifyPromise(
                declineUserRequest.mutateAsync(data),
                type === 'decree' ? 'userDecreeRequestDecline' : 'userCreationRequestDecline',
            ),

        acceptUserRequest: (data: { id: string; comment?: string }, type?: string) =>
            notifyPromise(
                acceptUserRequest.mutateAsync(data),
                type === 'decree' ? 'userDecreeRequestAccept' : 'userCreationRequestAccept',
            ),

        editUserCreationRequest: (data: EditUserCreationRequest, type?: string) =>
            notifyPromise(
                editUserCreationRequest.mutateAsync(data),
                type === 'decree' ? 'userDecreeRequestEdit' : 'userCreationRequestEdit',
            ),

        cancelUserRequest: (data: { id: string; comment?: string }, type?: string) =>
            notifyPromise(
                cancelUserRequest.mutateAsync(data),
                type === 'decree' ? 'userDecreeRequestCancel' : 'userCreationRequestCancel',
            ),

        createDecreeRequest: (data: UserDecreeSchema) =>
            notifyPromise(createDecreeRequest.mutateAsync(data), 'userDecreeRequestCreate'),
    };
};
