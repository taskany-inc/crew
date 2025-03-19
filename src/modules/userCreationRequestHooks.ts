import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import {
    CreateTransferInside,
    CreateUserCreationRequest,
    EditTransferInternToStaff,
    EditUserCreationRequest,
    TransferInternToStaff,
    UserDecreeEditSchema,
    UserDecreeSchema,
} from './userCreationRequestSchemas';

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

    const editDecreeRequest = trpc.userCreationRequest.editDecree.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const createTransferInternToStaffRequest = trpc.userCreationRequest.createTransferInternToStaffRequest.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const editTransferInternToStaffRequest = trpc.userCreationRequest.editTransferInternToStaffRequest.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const cancelTransferInternToStaffRequest = trpc.userCreationRequest.cancelTransferInternToStaffRequest.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    const createTransferInsideRequest = trpc.userCreationRequest.createTransferInsideRequest.useMutation({
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

        editUserCreationRequest: (data: EditUserCreationRequest) =>
            notifyPromise(editUserCreationRequest.mutateAsync(data), 'userCreationRequestEdit'),

        cancelUserRequest: (data: { id: string; comment?: string }, type?: string) =>
            notifyPromise(
                cancelUserRequest.mutateAsync(data),
                type === 'decree' ? 'userDecreeRequestCancel' : 'userCreationRequestCancel',
            ),

        createDecreeRequest: (data: UserDecreeSchema) =>
            notifyPromise(createDecreeRequest.mutateAsync(data), 'userDecreeRequestCreate'),

        editDecreeRequest: (data: UserDecreeEditSchema) =>
            notifyPromise(editDecreeRequest.mutateAsync(data), 'userDecreeRequestEdit'),

        createTransferInternToStaffRequest: (data: TransferInternToStaff) =>
            notifyPromise(createTransferInternToStaffRequest.mutateAsync(data), 'transferInternToStaffRequestCreate'),

        editTransferInternToStaffRequest: (data: EditTransferInternToStaff) =>
            notifyPromise(editTransferInternToStaffRequest.mutateAsync(data), 'transferInternToStaffRequestEdit'),

        cancelTransferInternToStaffRequest: (data: { id: string; comment?: string }) =>
            notifyPromise(cancelTransferInternToStaffRequest.mutateAsync(data), 'transferInternToStaffRequestCancel'),

        createTransferInsideRequest: (data: CreateTransferInside) =>
            notifyPromise(createTransferInsideRequest.mutateAsync(data), 'transferInsideRequestCreate'),
    };
};
