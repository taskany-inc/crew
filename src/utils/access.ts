import { UserRole } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { tr } from './utils.i18n';
import { ExtractKeysOfType } from './types';

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

export type AccessOperation = ExtractKeysOfType<UserRole, boolean>;

export const checkRoleForAccess = (userRole: UserRole | null, operation: AccessOperation) => {
    if (userRole?.[operation]) return allowed;
    return notAllowed(`${tr('Operation')} '${operation}' ${tr('is forbidden')}`);
};
