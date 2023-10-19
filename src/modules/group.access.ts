import { UserRole } from 'prisma/prisma-client';

import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

export const groupAccess = {
    isEditable: (sessionUser: SessionUser): AccessCheckResult => {
        if (sessionUser.role === UserRole.ADMIN) return allowed;
        return notAllowed(tr('Only admins can edit groups'));
    },
};
