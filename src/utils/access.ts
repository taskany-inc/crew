import { TRPCError } from '@trpc/server';

export type AccessCheckResult = { allowed: true } | { allowed: false; errorMessage: string };

export const allowed: AccessCheckResult = { allowed: true };

export const notAllowed = (errorMessage: string): AccessCheckResult => ({ allowed: false, errorMessage });

export const accessCheck = (result: AccessCheckResult) => {
    if (!result.allowed) throw new TRPCError({ code: 'FORBIDDEN', message: result.errorMessage });
};
