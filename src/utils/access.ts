import { UserRole } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { tr } from './utils.i18n';
import { ExtractKeysOfType } from './types';
import { objKeys } from './objKeys';

interface AccessCheckResultAllowed {
    allowed: true;
}
interface AccessCheckResultNotAllowed {
    allowed: false;
    errorMessage: string;
}
export type AccessCheckResult = AccessCheckResultAllowed | AccessCheckResultNotAllowed;

export const allowed: AccessCheckResult = { allowed: true };

export const notAllowed = (errorMessage: string): AccessCheckResult => ({ allowed: false, errorMessage });

export const accessCheck = (result: AccessCheckResult) => {
    if (!result.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: result.errorMessage });
};

export const accessCheckAnyOf = (...results: AccessCheckResult[]) => {
    const failed: AccessCheckResultNotAllowed[] = [];
    for (const result of results) {
        if (result.allowed) {
            return;
        }
        failed.push(result);
    }
    const message = failed.map((f) => f.errorMessage).join(', ');
    throw new TRPCError({ code: 'FORBIDDEN', message: `${tr('All operations are forbidden:')} ${message}` });
};

export const accessCheckAllOf = (...results: AccessCheckResult[]): AccessCheckResult => {
    const failed: AccessCheckResultNotAllowed[] = [];
    for (const result of results) {
        if (!result.allowed) {
            failed.push(result);
        }
    }
    if (failed.length === 0) {
        return { allowed: true };
    }
    const message = failed.map((f) => f.errorMessage).join(', ');
    throw new TRPCError({ code: 'FORBIDDEN', message: `${tr('Some operations are forbidden:')} ${message}` });
};

export type AccessOperation = ExtractKeysOfType<UserRole, boolean>;

export const checkRoleForAccess = (userRole: UserRole | null, operation: AccessOperation) => {
    if (userRole?.[operation]) return allowed;
    return notAllowed(`${tr('Operation')} '${operation}' ${tr('is forbidden')}`);
};

const scopesObj: Record<AccessOperation, true> = {
    editUserCreationRequests: true,
    editRoleScopes: true,
    editUserRole: true,
    createUser: true,
    editFullGroupTree: true,
    editScheduledDeactivation: true,
    editUser: true,
    editUserAchievements: true,
    editUserActiveState: true,
    editUserBonuses: true,
    viewHistoryEvents: true,
    viewScheduledDeactivation: true,
    viewUserBonuses: true,
    viewUserExtendedInfo: true,
    importData: true,
    decideOnUserCreationRequest: true,
    createExistingUserRequest: true,
    createInternalUserRequest: true,
    createExternalUserRequest: true,
    createExternalFromMainUserRequest: true,
    readManyInternalUserRequests: true,
    readManyExternalUserRequests: true,
    readManyExternalFromMainUserRequests: true,
    editInternalUserRequest: true,
    editExternalUserRequest: true,
    editExternalFromMainUserRequest: true,
};

export const scopes = objKeys(scopesObj);
