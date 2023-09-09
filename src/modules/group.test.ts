/* eslint-disable no-await-in-loop */
import { Group } from '@prisma/client';
import assert from 'assert';

import { prisma } from '../utils/prisma';

import { groupMethods } from './group.methods';

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
});
