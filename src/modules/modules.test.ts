import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '../utils/prisma';
import {
    createTestGroups,
    createTestUsers,
    createTestVacancies,
    deleteTestGroups,
    deleteTestUsers,
    deleteTestVacancies,
    testRootGroup,
} from '../utils/testDbData';

import { groupMethods } from './groupMethods';
import { userMethods } from './userMethods';
import { roleMethods } from './roleMethods';
import { searchMethods } from './searchMethods';
import { vacancyMethods } from './vacancyMethods';

describe('groups', () => {
    beforeEach(async () => {
        await createTestGroups();
        await createTestUsers();
        await createTestVacancies();
    });

    afterEach(async () => {
        await deleteTestVacancies();
        await deleteTestUsers();
        await deleteTestGroups();
    });

    it('creates test groups', async () => {
        const hierarchy = await groupMethods.getHierarchy(testRootGroup);
        assert.equal(Object.keys(hierarchy.dict).length, 11);
    });

    it('moves group', async () => {
        const groupBefore = await groupMethods.getById('barracuda');
        assert.notEqual(groupBefore.parentId, 'wildcat');
        const group = await groupMethods.move({ id: 'barracuda', newParentId: 'wildcat' });
        assert.equal(group.parentId, 'wildcat');
    });

    it('removes group parent', async () => {
        const groupBefore = await groupMethods.getById('barracuda');
        assert.notEqual(groupBefore.parentId, null);
        const group = await groupMethods.move({ id: 'barracuda', newParentId: null });
        assert.equal(group.parentId, null);
        await groupMethods.move({ id: 'barracuda', newParentId: testRootGroup });
    });

    it('archives/unarchives group memberships on user active state edit', async () => {
        const membershipsBefore = await userMethods.getMemberships('charmander');
        assert.equal(membershipsBefore.length, 1);
        await userMethods.editActiveState({ id: 'charmander', active: false });
        const membershipsDeactivated = await userMethods.getMemberships('charmander');
        assert.equal(membershipsDeactivated.length, 0);
        await userMethods.editActiveState({ id: 'charmander', active: true });
        const membershipsActivated = await userMethods.getMemberships('charmander');
        assert.equal(membershipsActivated.length, 1);
    });

    it("archives/unarchives group and it's memberships", async () => {
        await groupMethods.archive('goldfinch');
        const archivedGroup = await prisma.group.findUnique({
            where: { id: 'goldfinch' },
            include: { memberships: true },
        });
        assert.equal(archivedGroup?.archived, true);
        assert.equal(archivedGroup.memberships.length > 0, true);
        assert.equal(archivedGroup.memberships[0].archived, true);
        await groupMethods.unarchive('goldfinch');
        const unarchivedGroup = await prisma.group.findUnique({
            where: { id: 'goldfinch' },
            include: { memberships: true },
        });
        assert.equal(unarchivedGroup?.archived, false);
        assert.equal(unarchivedGroup.memberships[0].archived, false);
    });

    it('archives group with archived children', async () => {
        const children = await groupMethods.getChildren('porpoise');
        assert.equal(children.length, 1);
        await groupMethods.archive(children[0].id);
        const groupAfter = await groupMethods.archive('porpoise');
        assert.equal(groupAfter.archived, true);
    });

    it('kicks all users out of archived organizational group', async () => {
        await prisma.group.update({ where: { id: 'goldfinch' }, data: { organizational: true } });
        const membershipsBefore = await groupMethods.getMemberships('goldfinch');
        assert.equal(membershipsBefore.length, 1);
        await groupMethods.archive('goldfinch');
        await groupMethods.unarchive('goldfinch');
        const membershipsAfter = await groupMethods.getMemberships('goldfinch');
        assert.equal(membershipsAfter.length, 0);
    });

    it('kicks archived user out of all organizational groups', async () => {
        await prisma.group.update({ where: { id: 'goldfinch' }, data: { organizational: true } });
        const membershipsBefore = await userMethods.getMemberships('charmander');
        assert.equal(membershipsBefore.length, 1);
        await userMethods.editActiveState({ id: 'charmander', active: false });
        await userMethods.editActiveState({ id: 'charmander', active: true });
        const membershipsAfter = await userMethods.getMemberships('charmander');
        assert.equal(membershipsAfter.length, 0);
    });

    it('cannot add user to the same group twice', async () => {
        const check = () => userMethods.addToGroup({ userId: 'charmander', groupId: 'goldfinch' });
        await assert.rejects(check, { message: 'User is already a member of the group' });
    });

    it('cannot add user to multiple organizational groups', async () => {
        await prisma.group.update({ where: { id: 'gorilla' }, data: { organizational: true } });
        await prisma.group.update({ where: { id: 'goldfinch' }, data: { organizational: true } });
        await userMethods.addToGroup({ userId: 'pikachu', groupId: 'gorilla' });
        const check = () => userMethods.addToGroup({ userId: 'pikachu', groupId: 'goldfinch' });
        await assert.rejects(check, { message: 'User already has organizational membership' });
    });

    it('cannot make a group organizational, if it violates single org membership invariant', async () => {
        await groupMethods.edit({ groupId: 'goldfinch', organizational: true });
        await userMethods.addToGroup({ groupId: 'gorilla', userId: 'charmander' });
        const check = () => groupMethods.edit({ groupId: 'gorilla', organizational: true });
        await assert.rejects(check, { message: 'Multiple organizational memberships are forbidden' });
    });

    it('cannot get archived groups or memberships', async () => {
        const groupBefore = await groupMethods.getById('barracuda');
        assert.ok(groupBefore);
        const membershipsBefore = await groupMethods.getMemberships('barracuda');
        assert.equal(membershipsBefore.length > 0, true);
        assert(groupBefore.parentId);
        const childrenBefore = await groupMethods.getChildren(groupBefore.parentId);
        await groupMethods.archive('barracuda');
        const getByIdCheck = () => groupMethods.getById('barracuda');
        await assert.rejects(getByIdCheck, { message: 'No group with id barracuda' });
        const membershipsAfter = await groupMethods.getMemberships('barracuda');
        assert.equal(membershipsAfter.length, 0);
        const childrenAfter = await groupMethods.getChildren(groupBefore.parentId);
        assert.equal(childrenAfter.length, childrenBefore.length - 1);
        const getListResult = await groupMethods.getList({ search: 'barracuda' });
        assert.equal(getListResult.length, 0);
        const getHierarchyFromRootResult = await groupMethods.getHierarchy(testRootGroup);
        assert.equal(getHierarchyFromRootResult.dict.barracuda, undefined);
        const getHierarchyResult = await groupMethods.getHierarchy('barracuda');
        assert.equal(Object.keys(getHierarchyResult.dict).length, 0);
    });

    it('cannot get archived group from search', async () => {
        await groupMethods.archive('barracuda');
        const search = await searchMethods.global('barracuda');
        assert.equal(search.groups.length, 0);
    });

    it('cannot move archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.move({ id: 'barracuda', newParentId: 'zebra' });
        await assert.rejects(check, { message: 'Cannot move archived group' });
    });

    it('cannot move group into archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.move({ id: 'goldfinch', newParentId: 'barracuda' });
        await assert.rejects(check, { message: 'Cannot move group into archived group' });
    });

    it('cannot edit archived group', async () => {
        await groupMethods.archive('barracuda');
        const check = () => groupMethods.edit({ groupId: 'barracuda', description: 'New description' });
        await assert.rejects(check, { message: 'Cannot edit archived group' });
    });

    it('cannot edit archived membership', async () => {
        const memberships = await groupMethods.getMemberships('goldfinch');
        const membership = memberships[0];
        assert.ok(membership);
        await groupMethods.archive('goldfinch');
        const checkRemove = () =>
            userMethods.removeFromGroup({ userId: membership.userId, groupId: membership.groupId });
        await assert.rejects(checkRemove, { message: 'Cannot edit archived membership' });
        const checkAddRole = () =>
            roleMethods.addToMembership({ membershipId: membership.id, id: 'boss', type: 'existing' });
        await assert.rejects(checkAddRole, { message: 'Cannot edit archived membership' });
        const checkRemoveRole = () => roleMethods.removeFromMembership({ membershipId: membership.id, roleId: 'boss' });
        await assert.rejects(checkRemoveRole, { message: 'Cannot edit archived membership' });
    });

    it('cannot archive group with children', async () => {
        const check = () => groupMethods.archive('zebra');
        await assert.rejects(check, { message: 'Cannot archive group with children' });
    });

    it('cannot archive group with active vacancies', async () => {
        const activeGroupVacancies = await vacancyMethods.getList({
            teamIds: ['gorilla'],
            archived: false,
            statuses: ['ACTIVE', 'ON_HOLD', 'ON_CONFIRMATION'],
        });
        assert.ok(activeGroupVacancies.vacancies.length);
        const check = () => groupMethods.archive('gorilla');
        await assert.rejects(check, { message: 'Cannot archive group with active vacancies' });
    });

    it('cannot unarchive group with archived parent', async () => {
        await groupMethods.archive('duck');
        await groupMethods.archive('porpoise');
        const check = () => groupMethods.unarchive('duck');
        await assert.rejects(check, { message: 'Cannot unarchive group with archived parent' });
    });

    it('cannot delete group with children', async () => {
        const check = () => groupMethods.delete('zebra');
        await assert.rejects(check, { message: 'Cannot delete group with children' });
    });

    it('cannot move group inside itself', async () => {
        const check = () => groupMethods.move({ id: 'grouse', newParentId: 'grouse' });
        await assert.rejects(check, { message: 'Cannot move group inside itself' });
    });

    it('cannot move group inside its child', async () => {
        const check = () => groupMethods.move({ id: 'grouse', newParentId: 'wildcat' });
        await assert.rejects(check, { message: 'Cannot move group inside its child' });
    });

    it('check team group hierarchy count', async () => {
        const rootGroup = await groupMethods.getById('root-test');
        assert.ok(rootGroup);
        const treeMembershipsCount = await groupMethods.getTreeMembershipsCount(rootGroup.id);
        assert.equal(treeMembershipsCount, 5);

        const [randomMembership] = await userMethods.getMemberships('charmander');
        assert.ok(randomMembership);

        await userMethods.editActiveState({ id: randomMembership.user.id, active: false });

        const treeMembershipsCountWithoutMember = await groupMethods.getTreeMembershipsCount(rootGroup.id);
        assert.equal(treeMembershipsCountWithoutMember, 4);

        await userMethods.editActiveState({ id: randomMembership.user.id, active: true });

        const treeMembershipsCountWithMember = await groupMethods.getTreeMembershipsCount(rootGroup.id);
        assert.equal(treeMembershipsCountWithMember, 5);
    });
});
