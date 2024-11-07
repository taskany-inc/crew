/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buffer } from 'node:stream/consumers';
import readXlsxFile, { Row } from 'read-excel-file/node';

import { db } from '../utils/db';

import { StructureParsingConfig } from './importSchemas';
import { sendMail } from './nodemailer';

const getTypeDescriptions = (v: any) => {
    if (typeof v === 'string') return `string of length ${v.length}`;
    if (typeof v === 'number') return 'number';
    if (typeof v === 'bigint') return 'bigint';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'symbol') throw new Error('Cannot serialize symbol');
    if (typeof v === 'undefined') return 'undefined';
    if (typeof v === 'object') {
        if (v === null) {
            return 'null';
        }
        if (Array.isArray(v)) {
            return `array of length ${v.length}`;
        }
        return `object with ${Object.keys(v).length} keys`;
    }
    if (typeof v === 'function') throw new Error('Cannot serialize function');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dumpToJson = (filename: string, v: any) => {
    console.log(`Saving to ${filename} - ${getTypeDescriptions(v)}`);
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    fs.writeFileSync(`${dirname}/${filename}.json`, JSON.stringify(v, null, 2));
};

const getExcelData = async (
    fileStream: fs.ReadStream,
    config: StructureParsingConfig,
): Promise<{ rows: Row[]; columnNames: any }> => {
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
        groups: config.groups.map((g) => ({
            name: getColumnName(g.name),
            lead: getColumnName(g.lead),
        })),
    };
    return { rows: data.slice(1), columnNames };
};

const getStringCellValue = (row: Row, n?: number) => {
    if (n === undefined) return;
    const cell = row[n];
    if (typeof cell === 'string') {
        const trimmed = cell.trim();
        if (trimmed) return trimmed;
    }
};
const getNumberCellValue = (row: Row, n?: number) => {
    if (n === undefined) return;
    const cell = row[n];
    if (typeof cell === 'number') return cell;
    if (typeof cell === 'string' && /^\d$/.test(cell)) return Number(cell);
};

type AddError = (error: string) => void;

const getRowData = (row: Row, config: StructureParsingConfig, addError: AddError) => {
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
        groups,
    };
};

interface Person {
    id: string;
    name: string | null;
    role?: string;
}

interface Node {
    nodes: Record<string, Node>;
    teamLeads: Person[];
    people: Person[];
}

const createNode = (): Node => ({
    nodes: {},
    teamLeads: [],
    people: [],
});

const getNodeByPath = (struct: Node, path: string[]) => {
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

const createFindUser = (addError: AddError) => {
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
                .where(({ or }) => or({ 'User.name': fullName, 'UserNames.name': fullName }))
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

export const importMethods = {
    parseStructure: async (fileStream: fs.ReadStream, config: StructureParsingConfig, currentUserEmail: string) => {
        const { rows, columnNames } = await getExcelData(fileStream, config);

        const structure = createNode();

        const errors: string[] = [];
        const addError: AddError = (error) => errors.push(error);

        const findUser = createFindUser(addError);

        for (const row of rows) {
            if (row.length === 0) continue;

            const rowData = getRowData(row, config, addError);

            if (!rowData) continue;

            const user = await findUser({
                fullName: rowData.fullName,
                unitId: rowData.unitId,
                personnelNumber: rowData.personelNumber,
            });

            if (!user) continue;

            const groups = await Promise.all(
                rowData.groups
                    .filter((g, i, a) => a.findIndex((v) => v.name === g.name) === i)
                    .map(async (g) => {
                        const lead = g.lead ? await findUser({ fullName: g.lead }) : undefined;
                        return { name: g.name, lead };
                    }),
            );

            const path = groups.map((g) => g.name);

            groups.forEach((g, i) => {
                const node = getNodeByPath(structure, path.slice(0, i + 1));
                if (g.lead) {
                    node.teamLeads.push(g.lead);
                }
            });

            const node = getNodeByPath(structure, path);
            node.people.push(user);
        }

        if (process.env.NODE_ENV === 'development') {
            dumpToJson('structure', structure);
            dumpToJson('structure-errors', errors);
            dumpToJson('structure-column-names', columnNames);
        } else {
            sendMail({
                to: currentUserEmail,
                subject: 'Structure parsing results',
                attachments: [
                    {
                        filename: 'structure.json',
                        content: JSON.stringify(structure, null, 2),
                        contentType: 'text/plain',
                    },
                    {
                        filename: 'structure-errors.json',
                        content: JSON.stringify(errors, null, 2),
                        contentType: 'text/plain',
                    },
                    {
                        filename: 'structure-column-names.json',
                        content: JSON.stringify(columnNames, null, 2),
                        contentType: 'text/plain',
                    },
                ],
            });
        }
    },
};
