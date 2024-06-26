import { prisma } from '../utils/prisma';
import { AccessCheckResult, allowed, checkRoleForAccess, notAllowed } from '../utils/access';
import { SessionUser } from '../utils/auth';

import { tr } from './modules.i18n';

const checkGroupAdmin = async (groupId: string, userId: string) => {
    const admins = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT count(*)::INTEGER
            FROM "Group"
            LEFT JOIN "GroupAdmin" ON "Group".id = "GroupAdmin"."groupId"
            WHERE ("GroupAdmin"."userId" = ${userId} OR "Group"."supervisorId" = ${userId})
            AND "Group".id in (
        WITH RECURSIVE rectree AS (
            SELECT *
            FROM "Group"
            WHERE id = ${groupId}
        UNION ALL
            SELECT g.*
            FROM "Group" g
            JOIN rectree
                ON g.id = rectree."parentId"
        ) SELECT id FROM rectree
    )`;
    return admins[0].count;
};

export const groupAccess = {
    isEditable: async (sessionUser: SessionUser, groupId: string): Promise<AccessCheckResult> => {
        const fullAccess = checkRoleForAccess(sessionUser.role, 'editFullGroupTree');

        if (fullAccess.allowed) {
            return allowed;
        }

        const checkAdminCount = await checkGroupAdmin(groupId, sessionUser.id);

        if (checkAdminCount) return allowed;

        return notAllowed(tr('Only admins and supervisors can edit groups'));
    },
};
