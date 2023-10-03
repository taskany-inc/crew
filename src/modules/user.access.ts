import { UserRole } from 'prisma/prisma-client';

import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

export const userAccess = {
    isEditable: (sessionUser: SessionUser, userId: string): AccessCheckResult => {
        if (sessionUser.role === UserRole.ADMIN || userId === sessionUser.id) return allowed;
        return notAllowed(tr('Cannot edit another user'));
    },

    isBalanceEditable: (sessionUser: SessionUser): AccessCheckResult => {
        return sessionUser.role === UserRole.ADMIN ? allowed : notAllowed(tr('Only admins can edit balance'));
    },
};
