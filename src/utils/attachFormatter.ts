import { Dispatch, SetStateAction } from 'react';

import { File } from '../modules/attachTypes';

const getFileIdFromPath = (
    /** /api/attach?id=... */
    path: string,
) => path.substring(15);

export const attachFormatter = (
    uploadedFiles: Array<{ filePath: string; name: string; type: string }>,
    setFiles: Dispatch<SetStateAction<File[]>>,
) => {
    setFiles((prev) => [...prev, ...uploadedFiles.map((f) => ({ name: f.name, id: getFileIdFromPath(f.filePath) }))]);
    return '';
};
