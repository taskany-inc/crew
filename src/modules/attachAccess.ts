import { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { RequestHandler } from 'next-connect';
import { NextApiRequest, NextApiResponse } from 'next';

import { authOptions } from '../utils/auth';
import { AccessCheckResult, AccessOperation, checkRoleForAccess } from '../utils/access';

export type NextHandler = RequestHandler<NextApiRequest & { accessOptions?: AccessOperation }, NextApiResponse>;

type AccessChecker = (session: Session) => AccessCheckResult;

const createGuard =
    (...checkers: AccessChecker[]): NextHandler =>
    async (req, res, next) => {
        const session = await getServerSession(req, res, authOptions);

        if (!session) {
            res.status(401).end();
            return;
        }

        const results = checkers.map((checker) => checker(session));

        if (results.some((value) => value.allowed)) {
            next();
        } else {
            const errorMessage = results.reduce((acc, rec) => {
                if (!rec.allowed) acc += rec.errorMessage;
                return acc;
            }, '');

            res.setHeader('Content-Type', 'text/plain;  charset=UTF-8');
            res.status(403).end(errorMessage);
        }
    };

export const accessGuards = {
    attach: {
        create: createGuard((session) => checkRoleForAccess(session.user.role, 'editScheduledDeactivation')),
        readOne: createGuard(
            (session) => checkRoleForAccess(session.user.role, 'editScheduledDeactivation'),
            (session) => checkRoleForAccess(session.user.role, 'viewScheduledDeactivation'),
        ),
        delete: createGuard((session) => checkRoleForAccess(session.user.role, 'editScheduledDeactivation')),
    },
};
