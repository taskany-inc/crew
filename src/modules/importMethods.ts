/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import fs from 'fs';
import { buffer } from 'node:stream/consumers';
import readXlsxFile, { Row } from 'read-excel-file/node';
import { Membership } from 'prisma/prisma-client';

import { db } from '../utils/db';
import { regexName } from '../utils/regex';
import { dumpToJson } from '../utils/dump';

import { Person, StructureNode, StructureParsingConfig } from './importSchemas';
import { sendMail } from './nodemailer';
import { userMethods } from './userMethods';
import { groupRoleMethods } from './groupRoleMethods';
import { groupMethods } from './groupMethods';

const getExcelData = async (fileStream: fs.ReadStream, config: StructureParsingConfig) => {
    const file = await buffer(fileStream);
    const data = await readXlsxFile(file, { sheet: config.sheet });
    const headers = data[0];
    const getColumnName = (n?: number) => (n !== undefined ? headers[n] : undefined);
    const columnNames = {
        sheet: config.sheet,
        fullName: getColumnName(config.fullName),
        unitId: getColumnName(config.unitId),
        personnelNumber: getColumnName(config.personnelNumber),
        role: getColumnName(config.role),
        percent: getColumnName(config.percent),
        source: getColumnName(config.source),
        groups: config.groups.map((g) => ({
            name: getColumnName(g.name),
            lead: getColumnName(g.lead),
        })),
    };
    return { rows: data.slice(1), columnNames };
};

const skipList = ['0', '-'];

const getStringCellValue = (row: Row, n?: number) => {
    if (n === undefined) return;
    const cell = row[n];
    if (typeof cell === 'string') {
        const trimmed = cell.trim();
        if (skipList.includes(trimmed)) return;
        if (trimmed) return trimmed;
    }
};
const getNumberCellValue = (row: Row, n?: number) => {
    if (n === undefined) return;
    const cell = row[n];
    if (typeof cell === 'number') return cell;
    if (typeof cell === 'string' && /^\d+$/.test(cell)) return Number(cell);
};

type AddMessage = (message: string) => void;

const getRowData = (row: Row, config: StructureParsingConfig, addError: AddMessage) => {
    const fullName = getStringCellValue(row, config.fullName);
    if (!fullName) {
        addError(`No full name in row. ${JSON.stringify(row.slice(5))}`);
        return;
    }
    const groups: { name: string; lead?: string }[] = [];
    for (const g of config.groups) {
        const name = getStringCellValue(row, g.name);
        if (!name) {
            continue;
        }
        groups.push({ name, lead: getStringCellValue(row, g.lead) });
    }
    return {
        fullName,
        unitId: getStringCellValue(row, config.unitId),
        personelNumber: getStringCellValue(row, config.personnelNumber),
        role: getStringCellValue(row, config.role),
        percent: getNumberCellValue(row, config.percent),
        source: getStringCellValue(row, config.source),
        groups,
    };
};

const createNode = (): StructureNode => ({
    nodes: {},
    people: [],
});

const getNodeByPath = (struct: StructureNode, path: string[]) => {
    let currentNode = struct;
    const targetPath = [...path];
    while (targetPath.length > 0) {
        const pathElement = targetPath.shift() as string;
        if (!currentNode.nodes[pathElement]) {
            currentNode.nodes[pathElement] = createNode();
        }
        currentNode = currentNode.nodes[pathElement];
    }
    return currentNode;
};

type UserCache = Record<string, Person | null | undefined>;

const createFindUser = (addError: AddMessage) => {
    const fullNameCache: UserCache = {};
    const unitIdCache: UserCache = {};
    const personnelNumberCache: UserCache = {};

    const notFoundCache: Record<string, true> = {};

    const getWithCache = async (key: string | number, cache: UserCache, find: () => Promise<Person[]>) => {
        const cached = cache[key];
        if (cached === null) return;
        if (cached) return cached;
        const found = await find();
        if (found.length === 0) {
            cache[key] = null;
            return;
        }
        if (found.length > 1) {
            cache[key] = null;
            addError(`Multiple users found for: ${key}`);
            return;
        }
        if (found.length === 1) {
            const user = found[0];
            cache[key] = user;
            return user;
        }
    };

    return async ({
        fullName,
        unitId,
        personnelNumber,
    }: {
        fullName: string;
        unitId?: string;
        personnelNumber?: string;
    }): Promise<Person | undefined> => {
        if (unitId) {
            const user = await getWithCache(unitId, unitIdCache, () =>
                db
                    .selectFrom('User')
                    .leftJoin('SupplementalPosition', 'User.id', 'SupplementalPosition.userId')
                    .where('SupplementalPosition.unitId', '=', String(unitId))
                    .select(['User.id', 'User.name'])
                    .execute(),
            );
            if (user) return user;
        }
        if (personnelNumber) {
            const user = await getWithCache(personnelNumber, personnelNumberCache, () =>
                db
                    .selectFrom('User')
                    .leftJoin('SupplementalPosition', 'User.id', 'SupplementalPosition.userId')
                    .where('SupplementalPosition.personnelNumber', '=', personnelNumber)
                    .select(['User.id', 'User.name'])
                    .execute(),
            );
            if (user) return user;
        }
        fullName = fullName.replace(/\s\s+/g, ' ');
        const user = await getWithCache(fullName, fullNameCache, () =>
            db
                .selectFrom('User')
                .leftJoin('UserNames', 'User.id', 'UserNames.userId')
                .where((eb) =>
                    eb.or([
                        eb('User.name', '~*', regexName(fullName)),
                        eb('UserNames.name', '~*', regexName(fullName)),
                    ]),
                )
                .select(['User.id', 'User.name'])
                .execute(),
        );
        if (user) return user;
        const userKey = `${fullName}, unit id ${unitId}, personnel number ${personnelNumber}`;
        if (notFoundCache[userKey]) return;
        notFoundCache[userKey] = true;
        addError(`User not found: ${userKey}`);
    };
};

const parseError = (message: string, e?: unknown): string => {
    if (!e) return message;
    if (e instanceof Error) return `${message} - ${e.name} - ${e.message}`;
    if (typeof e === 'string') return `${message} - ${e}`;
    return `${message} - unknown error - ${JSON.stringify(e)}`;
};

export const importMethods = {
    parseStructure: async (fileStream: fs.ReadStream, config: StructureParsingConfig, currentUserEmail: string) => {
        const { rows, columnNames } = await getExcelData(fileStream, config);

        const structure = createNode();

        const errors: string[] = [];
        const addError: AddMessage = (error) => errors.push(error);

        const findUser = createFindUser(addError);

        for (const row of rows) {
            if (row.length === 0) continue;

            const rowData = getRowData(row, config, addError);

            if (!rowData) continue;

            const groups = await Promise.all(
                rowData.groups
                    .filter((g, i, a) => a.findIndex((v) => v.name === g.name) === i)
                    .filter((g) => !skipList.includes(g.name))
                    .map(async (g) => {
                        const lead = g.lead ? await findUser({ fullName: g.lead }) : undefined;
                        return { name: g.name, lead };
                    }),
            );

            const path = groups.map((g) => g.name);

            groups.forEach((g, i) => {
                const node = getNodeByPath(structure, path.slice(0, i + 1));
                if (g.lead) {
                    node.teamLead = g.lead;
                }
            });

            const user = await findUser({
                fullName: rowData.fullName,
                unitId: rowData.unitId,
                personnelNumber: rowData.personelNumber,
            });

            if (!user) continue;

            const node = getNodeByPath(structure, path);
            node.people.push(user);
        }

        if (process.env.NODE_ENV === 'development') {
            dumpToJson('structure-parse', structure);
            dumpToJson('structure-parse-errors', errors);
            dumpToJson('structure-parse-column-names', columnNames);
        } else {
            sendMail({
                to: currentUserEmail,
                subject: 'Structure parsing results',
                attachments: [
                    {
                        filename: 'structure-parse.json',
                        content: JSON.stringify(structure, null, 2),
                        contentType: 'text/plain',
                    },
                    {
                        filename: 'structure-parse-errors.json',
                        content: JSON.stringify(errors, null, 2),
                        contentType: 'text/plain',
                    },
                    {
                        filename: 'structure-parse-column-names.json',
                        content: JSON.stringify(columnNames, null, 2),
                        contentType: 'text/plain',
                    },
                ],
            });
        }
    },

    uploadStructure: async (structure: StructureNode, rootGroupId: string, currentUserEmail: string) => {
        const errors: string[] = [];
        const messages: string[] = [];

        const addError = (message: string, e?: unknown) => errors.push(parseError(message, e));
        const addMessage: AddMessage = (message) => messages.push(message);

        const addToGroupWithRole = async ({
            idAndPath,
            userId,
            userName,
            groupId,
            groupName,
            role,
        }: {
            idAndPath: string;
            userName: string | null;
            userId: string;
            groupId: string;
            groupName: string;
            role?: string;
        }) => {
            let membership: Membership | undefined;
            try {
                membership = await userMethods.addToGroup({ userId, groupId });
            } catch (e) {
                addError(`${idAndPath} ERROR adding user ${userName || userId} to group ${groupName}`, e);
            }

            if (membership && role) {
                const roleInstance = await db
                    .selectFrom('Role')
                    .where('Role.name', 'ilike', role)
                    .select(['id'])
                    .executeTakeFirst();

                try {
                    if (roleInstance) {
                        await groupRoleMethods.addToMembership({
                            membershipId: membership.id,
                            type: 'existing',
                            id: roleInstance.id,
                        });
                    } else {
                        addMessage(`Creating role ${role}`);
                        await groupRoleMethods.addToMembership({
                            membershipId: membership.id,
                            type: 'new',
                            name: role,
                        });
                    }
                } catch (e) {
                    addError(`${idAndPath} ERROR adding role ${role} to ${userName || userId}`, e);
                }
            }
        };

        const processNode = async (node: StructureNode, groupName: string, groupId: string, path: string) => {
            const idAndPath = `[${groupId}] ${path}`;

            for (const person of node.people) {
                await addToGroupWithRole({
                    idAndPath,
                    userId: person.id,
                    userName: person.name,
                    groupId,
                    groupName,
                    role: person.role,
                });
                if (node.teamLead) {
                    await db
                        .updateTable('Group')
                        .set({ supervisorId: node.teamLead.id })
                        .where('Group.id', '=', groupId)
                        .execute();
                }
            }

            for (const name of Object.keys(node.nodes)) {
                const newGroup = await groupMethods.create({ name, parentId: groupId });
                await processNode(node.nodes[name], name, newGroup.id, `${path} ${name} /`);
            }
        };

        await processNode(structure, 'ROOT', rootGroupId, 'ROOT /');

        if (process.env.NODE_ENV === 'development') {
            dumpToJson('structure-upload-messages', messages);
            dumpToJson('structure-upload-errors', errors);
        } else {
            sendMail({
                to: currentUserEmail,
                subject: 'Structure upload results',
                attachments: [
                    {
                        filename: 'structure-upload-messages.json',
                        content: JSON.stringify(messages, null, 2),
                        contentType: 'text/plain',
                    },
                    {
                        filename: 'structure-upload-errors.json',
                        content: JSON.stringify(errors, null, 2),
                        contentType: 'text/plain',
                    },
                ],
            });
        }
    },
};
