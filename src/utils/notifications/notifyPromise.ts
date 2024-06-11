import { TRPCClientError } from '@trpc/client';
import toast from 'react-hot-toast';

import {
    NotificationEvents,
    NotificationNamespaces,
    defaultNotifications,
    getNotificicationKeyMap,
} from './notificationsMap';

interface NotifyPromise {
    <T>(promise: Promise<T>, events: NotificationEvents): Promise<T>;
    <T>(promise: Promise<T>, namespace: NotificationNamespaces): Promise<T>;
}

const extractError = (error: unknown): string | undefined => {
    if (
        error instanceof TRPCClientError &&
        typeof error.data?.httpStatus === 'number' &&
        error.data.httpStatus >= 400 &&
        error.data.httpStatus < 500
    ) {
        return error.message;
    }
};

export const notifyPromise: NotifyPromise = (promise, eventsOrNamespace) => {
    let events: NotificationEvents;

    if (typeof eventsOrNamespace === 'string') {
        const notifyMap = getNotificicationKeyMap(eventsOrNamespace);

        events = {
            success: notifyMap.success ?? defaultNotifications.success,
            loading: notifyMap.loading ?? defaultNotifications.loading,
            error: notifyMap.error ?? defaultNotifications.error,
        };
    } else {
        events = eventsOrNamespace;
    }

    toast.promise(promise, {
        ...events,
        error: (e) => extractError(e) ?? events.error,
    });

    return promise;
};
