/* eslint-disable no-await-in-loop */

import { getApiHandler, getAuthChecker } from '../../utils/apiHandler';
import { postHandler, getHandler } from '../../modules/attachHandler';

export const config = {
    api: {
        bodyParser: false,
    },
};

const handler = getApiHandler().use(getAuthChecker()).get(getHandler).post(postHandler);

export default handler;
