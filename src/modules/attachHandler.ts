/* eslint-disable no-await-in-loop */
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import stream from 'stream';
import { getServerSession } from 'next-auth/next';
import { formFieldName } from '@taskany/bricks';

import { pages } from '../hooks/useRouter';
import { authOptions } from '../utils/auth';

import { attachMethods } from './attachMethods';
import { getObject, loadFile } from './s3Methods';
import { tr } from './modules.i18n';
import { importMethods } from './importMethods';
import { structureParsingConfigSchema } from './importSchemas';

interface ResponseObj {
    failed: { type: string; filePath: string; name: string }[];
    succeeded: { type: string; filePath: string; name: string }[];
    errorMessage?: string;
}

class ErrorWithStatus extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const form = formidable({ multiples: true });

    await new Promise((_resolve, reject) => {
        form.parse(req, async (err, fields, files) => {
            if (err instanceof Error) {
                return reject(new ErrorWithStatus(err.message, 500));
            }

            if (!files[formFieldName]) return reject(new ErrorWithStatus(tr('No data'), 400));

            const data = [files[formFieldName]].flat();

            const resultObject: ResponseObj = {
                failed: [],
                succeeded: [],
            };

            for (const file of data) {
                const filename = file.originalFilename || file.newFilename;
                const link = `${Date.now()}_${filename}`;
                const readStream = fs.createReadStream(file.filepath);

                if ('parseStructure' in req.query && req.session) {
                    const config = JSON.parse(fields.config as string);
                    const parsedConfig = structureParsingConfigSchema.parse(config);
                    importMethods.parseStructure(readStream, parsedConfig, req.session.user.email);
                    res.send('ok');
                    return;
                }

                const response = await loadFile(link, readStream, file.mimetype || '');

                if (response) {
                    resultObject.errorMessage = response;
                    resultObject.failed.push({ type: file.mimetype || '', filePath: filename, name: filename });
                } else {
                    const attach = await attachMethods.create({
                        link,
                        filename,
                    });
                    resultObject.succeeded.push({
                        type: file.mimetype || '',
                        filePath: pages.attach(attach.id),
                        name: filename,
                    });
                }
            }

            res.send(resultObject);
        });
    });
};

export const getHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const fileId = req.query.id;
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        res.status(401).end();
        return;
    }

    const attach = await attachMethods.getById(String(fileId), session.user);

    const file = await getObject(attach.link);

    if (!file) throw new ErrorWithStatus(tr('No file found'), 404);

    const newFileName = encodeURIComponent(attach.filename);

    res.setHeader('Content-Type', file.ContentType || '');
    res.setHeader('Content-Disposition', `filename*=UTF-8''${newFileName}`);

    const readableStream = file.Body as stream.Readable;

    readableStream.pipe(res);
};
