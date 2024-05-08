import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

export const userAccess = {
    isEditable: (sessionUser: SessionUser, userId: string): AccessCheckResult => {
        if (sessionUser.role?.editUser || userId === sessionUser.id) return allowed;
        return notAllowed(tr('Cannot edit another user'));
    },

    isActivityViewable: (sessionUser: SessionUser, userId: string): AccessCheckResult => {
        if (sessionUser.role?.viewHistoryEvents || userId === sessionUser.id) return allowed;
        return notAllowed(tr('Cannot view activity of another user'));
    },
};
