import { UserRole } from 'prisma/prisma-client';

import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

export const userAccess = {
    isEditable: (sessionUser: SessionUser, userId: string): AccessCheckResult => {
        if (sessionUser.role === UserRole.ADMIN || userId === sessionUser.id) return allowed;
        return notAllowed(tr('Cannot edit another user'));
    },

    isActiveStateEditable: (sessionUser: SessionUser): AccessCheckResult => {
        return sessionUser.role === UserRole.ADMIN
            ? allowed
            : notAllowed(tr('Only admins can activate or deactivate profiles'));
    },

    isBonusEditable: (sessionUser: SessionUser): AccessCheckResult => {
        return sessionUser.role === UserRole.ADMIN ? allowed : notAllowed(tr('Only admins can edit bonus points'));
    },

    isBonusViewable: (sessionUser: SessionUser, userId: string): AccessCheckResult => {
        if (sessionUser.role === UserRole.ADMIN || userId === sessionUser.id) return allowed;
        return notAllowed(tr('Cannot view another user bonus points'));
    },
};
