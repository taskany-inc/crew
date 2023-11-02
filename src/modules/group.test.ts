import { UserRole } from 'prisma/prisma-client';
import assert from 'assert';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import {
    createTestGroups,
    createTestUsers,
    deleteTestGroups,
    deleteTestUsers,
    testRootGroup,
} from '../utils/testDbData';

import { groupMethods } from './groupMethods';
import { userMethods } from './userMethods';
import { roleMethods } from './roleMethods';
import { searchMethods } from './searchMethods';

const mockSessionUser: SessionUser = { id: '', name: '', email: '', role: UserRole.USER };

describe('groups', () => {
    beforeEach(async () => {
        await createTestGroups();
        await createTestUsers();
    });

    afterEach(async () => {
        await deleteTestUsers();
        await deleteTestGroups();
    });

    it('creates test groups', async () => {
        const hierarchy = await groupMethods.getHierarchy(testRootGroup);
        expect(Object.keys(hierarchy.dict).length).toBe(11);
    });

    it('moves group', async () => {
        const groupBefore = await groupMethods.getById('barracuda', mockSessionUser);
        expect(groupBefore.parentId).not.toBe('wildcat');
        const group = await groupMethods.move({ id: 'barracuda', newParentId: 'wildcat' });
        expect(group.parentId).toBe('wildcat');
    });

    it('removes group parent', async () => {
        const groupBefore = await groupMethods.getById('barracuda', mockSessionUser);
        expect(groupBefore.parentId).not.toBeNull();
        const group = await groupMethods.move({ id: 'barracuda', newParentId: null });
        expect(group.parentId).toBeNull();
        await groupMethods.move({ id: 'barracuda', newParentId: testRootGroup });
    });

    it("archives/unarchives group and it's memberships", async () => {
        await groupMethods.archive('goldfinch');
        const archivedGroup = await prisma.group.findUnique({
            where: { id: 'goldfinch' },
            include: { memberships: true },
        });
        expect(archivedGroup?.archived).toBe(true);
        expect(archivedGroup?.memberships.length).toBeGreaterThan(0);
        expect(archivedGroup?.memberships[0].archived).toBe(true);
        await groupMethods.unarchive('goldfinch');
        const unarchivedGroup = await prisma.group.findUnique({
            where: { id: 'goldfinch' },
            include: { memberships: true },
        });
        expect(unarchivedGroup?.archived).toBe(false);
        expect(unarchivedGroup?.memberships[0].archived).toBe(false);
    });

    it('archives group with archived children', async () => {
        const children = await groupMethods.getChildren('porpoise');
        expect(children.length).toBe(1);
        await groupMethods.archive(children[0].id);
        const groupAfter = await groupMethods.archive('porpoise');
        expect(groupAfter.archived).toBe(true);
    });

    it('cannot get archived groups or memberships', async () => {
        const groupBefore = await groupMethods.getById('barracuda', mockSessionUser);
        expect(groupBefore).toBeTruthy();
        const membershipsBefore = await groupMethods.getMemberships('barracuda');
        expect(membershipsBefore.length).toBeGreaterThan(0);
        assert(groupBefore.parentId);
        const childrenBefore = await groupMethods.getChildren(groupBefore.parentId);
        await groupMethods.archive('barracuda');
        const getByIdCheck = () => groupMethods.getById('barracuda', mockSessionUser);
        await expect(getByIdCheck).rejects.toThrowErrorMatchingInlineSnapshot('"No group with id barracuda"');
        const membershipsAfter = await groupMethods.getMemberships('barracuda');
        expect(membershipsAfter.length).toBe(0);
        const childrenAfter = await groupMethods.getChildren(groupBefore.parentId);
        expect(childrenAfter.length).toBe(childrenBefore.length - 1);
        const getListResult = await groupMethods.getList({ search: 'barracuda' });
        expect(getListResult.length).toBe(0);
        const getHierarchyFromRootResult = await groupMethods.getHierarchy(testRootGroup);
        expect(getHierarchyFromRootResult.dict.barracuda).toBeUndefined();
        const getHierarchyResult = await groupMethods.getHierarchy('barracuda');
        expect(Object.keys(getHierarchyResult.dict).length).toBe(0);
    });

    it('cannot get archived group from search', async () => {
        await groupMethods.archive('barracuda');
        const search = await searchMethods.global('barracuda');
        expect(search.groups.length).toBe(0);
    });

    it('cannot move archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.move({ id: 'barracuda', newParentId: 'zebra' });
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot move archived group"');
    });

    it('cannot move group into archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.move({ id: 'goldfinch', newParentId: 'barracuda' });
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot move group into archived group"');
    });

    it('cannot edit archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.edit({ groupId: 'barracuda', description: 'New description' });
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot edit archived group"');
    });

    it('cannot edit archived membership', async () => {
        const memberships = await groupMethods.getMemberships('goldfinch');
        const membership = memberships[0];
        expect(membership).toBeTruthy();
        await groupMethods.archive('goldfinch');
        const checkAdd = () => userMethods.addToGroup({ userId: membership.userId, groupId: membership.groupId });
        expect(checkAdd).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot edit archived membership"');
        const checkRemove = () =>
            userMethods.removeFromGroup({ userId: membership.userId, groupId: membership.groupId });
        await expect(checkRemove).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot edit archived membership"');
        const checkAddRole = () => roleMethods.addToMembership({ membershipId: membership.id, roleId: 'boss' });
        await expect(checkAddRole).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot edit archived membership"');
        const checkRemoveRole = () => roleMethods.removeFromMembership({ membershipId: membership.id, roleId: 'boss' });
        await expect(checkRemoveRole).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot edit archived membership"');
    });

    it('cannot archive group with children', async () => {
        const check = () => groupMethods.archive('zebra');
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot archive group with children"');
    });

    it('cannot unarchive group with archived parent', async () => {
        await groupMethods.archive('duck');
        await groupMethods.archive('porpoise');
        const check = () => groupMethods.unarchive('duck');
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot unarchive group with archived parent"');
    });

    it('cannot delete group with children', async () => {
        const check = () => groupMethods.delete('zebra');
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot delete group with children"');
    });

    it('cannot move group inside itself', async () => {
        const check = () => groupMethods.move({ id: 'grouse', newParentId: 'grouse' });
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot move group inside itself"');
    });

    it('cannot move group inside its child', async () => {
        const check = () => groupMethods.move({ id: 'grouse', newParentId: 'wildcat' });
        await expect(check).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot move group inside its child"');
    });
});
