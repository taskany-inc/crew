import { groupMethods } from '../modules/groupMethods';

import { db } from './db';

export const getUnitGroup = async (groupId: string): Promise<string | undefined> => {
    const { orgGroupId } = await db.selectFrom('AppConfig').select('AppConfig.orgGroupId').executeTakeFirstOrThrow();
    if (!orgGroupId) return;
    const breadcrumbs = await groupMethods.getBreadcrumbs(groupId);
    if (breadcrumbs.length < 2) return;
    if (breadcrumbs[0].id !== orgGroupId) return;
    return breadcrumbs[1].name;
};
