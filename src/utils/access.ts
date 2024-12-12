import { UserRole } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { config } from '../config';
import { tr as accessTr } from '../components/PageHeader/PageHeader.i18n';

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

export const scopesDescriptions: Record<AccessOperation, string> = {
    editRoleScopes: accessTr('editing role scopes'),
    editUserRole: accessTr('editing user roles'),
    createUser: accessTr('creating users'),
    editUser: accessTr('editing users'),
    editUserCreationRequests: accessTr('user creation request'),
    editUserActiveState: accessTr('deactivating users'),
    editUserAchievements: accessTr('giving out achievements'),
    editUserBonuses: accessTr('editing user bonus points'),
    viewUserBonuses: accessTr('viewing user bonus points'),
    viewUserExtendedInfo: accessTr('viewing user extended info'),
    editScheduledDeactivation: accessTr('creating and editing scheduled deactivations'),
    viewScheduledDeactivation: accessTr('viewing scheduled deactivations'),

    editFullGroupTree: accessTr('editing any team'),

    viewHistoryEvents: accessTr('viewing history of changes'),

    importData: accessTr('import data from file'),

    decideOnUserCreationRequest: accessTr('decide on user creation request'),
    createExistingUserRequest: accessTr('create request to create profile to existing employee'),
    createInternalUserRequest: accessTr('create request to create profile to newcomer'),
    createExternalUserRequest: accessTr('create request to create profile to external employee'),
    createExternalFromMainUserRequest: accessTr('createExternalFromMainUserRequest {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),

    readManyInternalUserRequests: accessTr('readManyInternalUserRequests'),
    readManyExternalUserRequests: accessTr('readManyExternalUserRequests'),
    readManyExternalFromMainUserRequests: accessTr('readManyExternalFromMainUserRequests {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),

    editInternalUserRequest: accessTr('editInternalUserRequest'),
    editExternalUserRequest: accessTr('editExternalUserRequest'),
    editExternalFromMainUserRequest: accessTr('editExternalFromMainUserRequest {mainOrgName}', {
        mainOrgName: config.mainOrganizationName || 'Main',
    }),
};
