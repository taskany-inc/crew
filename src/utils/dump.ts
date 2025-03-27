/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './logger';

const getTypeDescription = (v: unknown) => {
    if (typeof v === 'string') {
        const lines = v.split('\n').length;
        return `string of length ${v.length}, lines: ${lines}`;
    }
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
export const dumpToJson = (filename: string, v: any) => {
    logger.info(`Saving to ${filename}.json - ${getTypeDescription(v)}`);
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    fs.writeFileSync(`${dirname}/${filename}.json`, JSON.stringify(v, null, 2));
};

export const dumpToTxt = (filename: string, v: string) => {
    logger.info(`Saving to ${filename}.txt - ${getTypeDescription(v)}`);
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    fs.writeFileSync(`${dirname}/${filename}.txt`, v);
};
