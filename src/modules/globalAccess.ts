import { UserRole } from 'prisma/prisma-client';

import { AccessCheckResult, allowed, notAllowed } from '../utils/access';
import { mapObject } from '../utils/mapObject';

import { tr } from './modules.i18n';

export const globalAccess = {
    group: {
        create: (userRole: UserRole): AccessCheckResult => {
            if (userRole === UserRole.ADMIN) return allowed;
            return notAllowed(tr('Only admins can create groups'));
        },
        createVirtual: (): AccessCheckResult => {
            return allowed;
        },
    },
    user: {
        create: (userRole: UserRole): AccessCheckResult => {
            if (userRole === UserRole.ADMIN) return allowed;
            return notAllowed(tr('Only admins can create users'));
        },
    },
};

export type GlobalAccess = {
    [K in keyof typeof globalAccess]: {
        [KK in keyof (typeof globalAccess)[K]]: boolean;
    };
};

export const createGlobalAccessObject = (userRole: UserRole): GlobalAccess => {
    return mapObject(globalAccess, (actions) => {
        return mapObject(actions, (action) => action(userRole).allowed);
    }) as GlobalAccess;
};
