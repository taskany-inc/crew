import { Dispatch, SetStateAction } from 'react';

import { File } from '../modules/attachTypes';

const getFileIdFromPath = (
    /** /api/attach?id=... */
    path: string,
) => path.substring(15);

const fileToMD = (file: { filePath: string; name: string; type: string }) => {
    switch (true) {
        case file.type.includes('image/'):
            return `![](${file.filePath})`;
        default:
            return `[${file.name}](${file.filePath})`;
    }
};

export const attachFormatter = (
    uploadedFiles: Array<{ filePath: string; name: string; type: string }>,
    setFiles?: Dispatch<SetStateAction<File[]>>,
    cb?: (args: string[]) => void,
) => {
    setFiles &&
        setFiles((prev) => {
            cb && cb([...prev.map((f) => f.id), ...uploadedFiles.map((f) => getFileIdFromPath(f.filePath))]);
            return [...prev, ...uploadedFiles.map((f) => ({ name: f.name, id: getFileIdFromPath(f.filePath) }))];
        });

    return uploadedFiles.map(fileToMD).join('\n');
};
