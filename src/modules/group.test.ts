/* eslint-disable no-await-in-loop */
import { Group, UserRole } from 'prisma/prisma-client';
import assert from 'assert';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';

import { groupMethods } from './group.methods';

const mockSessionUser: SessionUser = { id: '', name: '', email: '', role: UserRole.USER };

type TreeNode = { [key: string]: TreeNode };

const testGroupTree: TreeNode = {
    zebra: {
        grouse: {
            wildcat: {
                gorilla: {},
                goldfinch: {},
            },
        },
        barracuda: {},
    },
    giraffe: {
        fish: {},
        porpoise: {
            duck: {},
        },
    },
};

const createGroupsFromNode = async (node: TreeNode, parent: Group) => {
    const keys = Object.keys(node);
    for (const name of keys) {
        const subNode = node[name];
        const group = await prisma.group.create({
            data: {
                id: name,
                parentId: parent.id,
                name,
            },
        });
        await createGroupsFromNode(subNode, group);
    }
};

const testRoot = 'root-test';

export const createTestGroups = async (): Promise<void> => {
    const rootGroup = await prisma.group.create({
        data: {
            id: testRoot,
            parentId: null,
            name: testRoot,
        },
    });

    await createGroupsFromNode(testGroupTree, rootGroup);
};

const deleteTestGroups = async () => {
    const roots = await groupMethods.getRoots();
    const root = roots.find((g) => g.name === testRoot);
    assert(root);
    const groupsToDelete: string[] = [testRoot];

    const processGroup = async (id: string) => {
        const children = await groupMethods.getChildren(id);
        for (const child of children) {
            groupsToDelete.push(child.id);
            await processGroup(child.id);
        }
    };

    await processGroup(root.id);

    for (const id of groupsToDelete.reverse()) {
        await groupMethods.delete(id);
    }
};

describe('groups', () => {
    beforeEach(createTestGroups);
    afterEach(deleteTestGroups);

    it('creates test groups', async () => {
        const hierarchy = await groupMethods.getHierarchy(testRoot);
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
        await groupMethods.delete('barracuda');
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
