/* eslint-disable no-await-in-loop */
import { Group } from 'prisma/prisma-client';
import assert from 'assert';

import { groupMethods } from '../modules/groupMethods';

import { prisma } from './prisma';

interface GroupTreeNode {
    [key: string]: GroupTreeNode;
}

const testGroupTree: GroupTreeNode = {
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

const createGroupsFromNode = async (node: GroupTreeNode, parent: Group) => {
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

export const testRootGroup = 'root-test';

export const createTestGroups = async (): Promise<void> => {
    const rootGroup = await prisma.group.create({
        data: {
            id: testRootGroup,
            parentId: null,
            name: testRootGroup,
        },
    });

    await createGroupsFromNode(testGroupTree, rootGroup);
};

export const deleteTestGroups = async () => {
    const roots = await groupMethods.getRoots();
    const root = roots.find((g) => g.name === testRootGroup);
    assert(root);
    const groupsToDelete: string[] = [testRootGroup];

    const processGroup = async (id: string) => {
        const children = await prisma.group.findMany({ where: { parentId: id } });
        for (const child of children) {
            groupsToDelete.push(child.id);
            await processGroup(child.id);
        }
    };

    await processGroup(root.id);

    await prisma.group.deleteMany({ where: { id: { in: groupsToDelete } } });
};

const testRoles = ['boss', 'chief', 'captain', 'baron', 'commander', 'honcho', 'principal'];

interface TestUserInfo {
    user: string;
    groups: { name: string; roles: string[] }[];
    supervisor?: string;
}

const testUsers: TestUserInfo[] = [
    {
        user: 'bulbasaur',
        groups: [
            { name: 'zebra', roles: ['boss'] },
            { name: 'wildcat', roles: ['chief', 'captain'] },
        ],
    },
    { user: 'charmander', groups: [{ name: 'goldfinch', roles: ['baron'] }] },
    {
        user: 'squirtle',
        groups: [
            { name: 'barracuda', roles: ['commander', 'honcho'] },
            { name: 'fish', roles: ['principal'] },
        ],
    },
    {
        user: 'pikachu',
        groups: [],
        supervisor: 'bulbasaur',
    },
];

export const createTestUsers = async () => {
    await prisma.role.createMany({ data: testRoles.map((role) => ({ id: role, name: role })) });
    for (const userData of testUsers) {
        await prisma.user.create({
            data: {
                id: userData.user,
                name: userData.user,
                email: `${userData.user}@example.com`,
                supervisor: userData.supervisor ? { connect: { id: userData.supervisor } } : undefined,
            },
        });
        for (const group of userData.groups) {
            await prisma.membership.create({
                data: {
                    userId: userData.user,
                    groupId: group.name,
                    roles: { connect: group.roles.map((role) => ({ id: role })) },
                },
            });
        }
    }
};

export const deleteTestUsers = async () => {
    const userNames = testUsers.map((userData) => userData.user);
    await prisma.role.deleteMany({ where: { id: { in: testRoles } } });
    await prisma.membership.deleteMany({ where: { userId: { in: userNames } } });
    await prisma.user.deleteMany({ where: { id: { in: userNames } } });
};
