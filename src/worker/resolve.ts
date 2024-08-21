import * as Sentry from '@sentry/nextjs';

import { historyEventMethods } from '../modules/historyEventMethods';
import { userMethods } from '../modules/userMethods';

import { JobDataMap } from './create';

export const scheduledDeactivation = async ({ userId }: JobDataMap['scheduledDeactivation']) => {
    try {
        await userMethods.editActiveState({ id: userId, active: false });
        await historyEventMethods.create({ subsystem: 'Scheduled profile deactivate' }, 'editUserActiveState', {
            userId,
            groupId: undefined,
            before: true,
            after: false,
        });
    } catch (error) {
        Sentry.captureException(error, {
            fingerprint: ['worker', 'resolve'],
        });
    }
};

export const createProfile = async ({ userCreationRequestId }: JobDataMap['createProfile']) => {
    try {
        const user = await userMethods.createUserFromRequest(userCreationRequestId);

        const phone = user.services.find((service) => service.serviceName === 'Phone')?.serviceId;

        await historyEventMethods.create({ subsystem: 'Scheduled profile creation' }, 'createUser', {
            userId: user.id,
            groupId: undefined,
            before: undefined,
            after: {
                name: user.name || undefined,
                email: user.email,
                phone,
                login: user.login || undefined,
                organizationalUnitId: user.organizationUnitId || undefined,
                supervisorId: user.supervisorId || undefined,
            },
        });
    } catch (error) {
        Sentry.captureException(error, {
            fingerprint: ['worker', 'resolve'],
        });
    }
};
