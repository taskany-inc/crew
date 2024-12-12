import { UserRole } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { config } from '../config';

import { ExtractKeysOfType } from './types';
import { objKeys } from './objKeys';
import { tr } from './utils.i18n';

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

export const scopesDescriptions = (): Record<AccessOperation, string> => ({
    editRoleScopes: tr('editing role scopes'),
    editUserRole: tr('editing user roles'),
    createUser: tr('creating users'),
    editUser: tr('editing users'),
    editUserCreationRequests: tr('user creation request'),
    editUserActiveState: tr('deactivating users'),
    editUserAchievements: tr('giving out achievements'),
    editUserBonuses: tr('editing user bonus points'),
    viewUserBonuses: tr('viewing user bonus points'),
    viewUserExtendedInfo: tr('viewing user extended info'),
    editScheduledDeactivation: tr('creating and editing scheduled deactivations'),
    viewScheduledDeactivation: tr('viewing scheduled deactivations'),

    editFullGroupTree: tr('editing any team'),

    viewHistoryEvents: tr('viewing history of changes'),

    importData: tr('import data from file'),

    decideOnUserCreationRequest: tr('decide on user creation request'),
    createExistingUserRequest: tr('create request to create profile to existing employee'),
    createInternalUserRequest: tr('create request to create profile to newcomer'),
    createExternalUserRequest: tr('create request to create profile to external employee'),
    createExternalFromMainUserRequest: tr('createExternalFromMainUserRequest {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),

    readManyInternalUserRequests: tr('readManyInternalUserRequests'),
    readManyExternalUserRequests: tr('readManyExternalUserRequests'),
    readManyExternalFromMainUserRequests: tr('readManyExternalFromMainUserRequests {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),

    editInternalUserRequest: tr('editInternalUserRequest'),
    editExternalUserRequest: tr('editExternalUserRequest'),
    editExternalFromMainUserRequest: tr('editExternalFromMainUserRequest {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),
});
