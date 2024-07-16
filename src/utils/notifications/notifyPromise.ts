import { TRPCClientError } from '@trpc/client';
import toast from 'react-hot-toast';
import { typeToFlattenedError } from 'zod';

import {
    NotificationEvents,
    NotificationNamespaces,
    defaultNotifications,
    getNotificicationKeyMap,
} from './notificationsMap';
import { tr } from './notifications.i18n';

interface NotifyPromise {
    <T>(promise: Promise<T>, events: NotificationEvents): Promise<T>;
    <T>(promise: Promise<T>, namespace: NotificationNamespaces): Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFlattenedZodError = (e: unknown): e is typeToFlattenedError<any, string> => {
    return typeof e === 'object' && e !== null && 'formErrors' in e && 'fieldErrors' in e;
};

const extractError = (error: unknown): string | undefined => {
    if (
        error instanceof TRPCClientError &&
        typeof error.data?.httpStatus === 'number' &&
        error.data.httpStatus >= 400 &&
        error.data.httpStatus < 500
    ) {
        const { zodError } = error.data;
        if (isFlattenedZodError(zodError)) {
            const fieldErrors = Object.entries(zodError.fieldErrors).map(([k, v]) => `${k} - ${v?.join(', ')}`);
            return [tr('Validation error'), ...zodError.formErrors, ...fieldErrors].join('\n');
        }
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
