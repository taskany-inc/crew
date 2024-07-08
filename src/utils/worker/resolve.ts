import * as Sentry from '@sentry/nextjs';

import { historyEventMethods } from '../../modules/historyEventMethods';
import { userMethods } from '../../modules/userMethods';

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
