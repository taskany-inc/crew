import fs from 'fs';
import { buffer } from 'node:stream/consumers';
import readXlsxFile from 'read-excel-file/node';

import { StructureParsingConfig } from './importSchemas';

export const importMethods = {
    parseStructure: async (fileStream: fs.ReadStream, config: StructureParsingConfig) => {
        const file = await buffer(fileStream);
        await readXlsxFile(file, { sheet: config.sheet });
    },
};
