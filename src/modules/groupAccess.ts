import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

export const groupAccess = {
    isEditable: (sessionUser: SessionUser): AccessCheckResult => {
        if (sessionUser.role?.editFullGroupTree || sessionUser.role?.editAdministratedGroupTree) return allowed;
        return notAllowed(tr('Only admins and supervisors can edit groups'));
    },
};
